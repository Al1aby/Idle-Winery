import { create } from 'zustand'
import {
  GRAPE_VARIETIES, UPGRADE_DEFS, STAFF_DEFS, EXPORT_CITIES,
  VINE_COOLDOWN, GRAPES_PER_BARREL, FERMENT_SECS, PRESS_SECS,
  VINE_ROW_COSTS, AD_WORKER_DURATION,
  EVENTS_LIST, DAILY_REWARDS, VISITOR_POOL,
  BLEND_NAMES, BLEND_BONUS, AD_DURATION,
  fmt, mmss, gUpgVal, gUpgCost, stkCost
} from '../constants/game.js'
import { SFX } from '../audio/sfx.js'

export { fmt, mmss }

const SAVE_KEY = 'vineyardIdle_v2'

// ── Inventory helpers ─────────────────────────────────────────────────────────
const mkInv = () => ({ grapes: 0, barrels: 0, wine: 0 })

const inv2totals = inv => ({
  grapes:  Object.values(inv).reduce((t, v) => t + (v.grapes  || 0), 0),
  barrels: Object.values(inv).reduce((t, v) => t + (v.barrels || 0), 0),
  wine:    Object.values(inv).reduce((t, v) => t + (v.wine    || 0), 0),
})

function initialState() {
  return {
    money: 50,
    grapes: 0,
    barrels: 0,
    wine: 0,
    fame: 0,
    prestigeLvl: 0,
    activeVariety: 'chardonnay',
    unlockedVarieties: ['chardonnay'],
    upgrades: {},
    staff: {},
    vines: Array.from({ length: 4 }, (_, i) => ({ id: i, cooldown: 0 })),
    // per-variety inventory: { [varietyId]: { grapes, barrels, wine } }
    inventory: { chardonnay: mkInv() },
    // press cooldown (grapes are deducted immediately; barrels granted after timer)
    pressQueue: 0,
    pressSecs: 0,
    pressVariety: null,
    // fermentation
    fermentQueue: 0,
    fermentSecs: 0,
    fermentVariety: null,
    // ad-powered automation timers (seconds remaining)
    adWorkers: { harvester: 0, presser: 0, cellarMgr: 0 },
    exportActive: null,
    activeEvent: null, eventSecs: 0, eventProgress: 0,
    lastDaily: null, dailyStreak: 0,
    visitor: null, visitorTimer: 0,
    adTimer: 0, adActive: false,
    blendA: null, blendB: null, blendResult: null,
    iapOwned: [],
    notification: null,
    tab: 'home',
    tickCount: 0,
    grapeQueue: 0,
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return initialState()
    const loaded = JSON.parse(raw)
    const state = { ...initialState(), ...loaded }

    // Ensure inventory entry for every unlocked variety
    if (!state.inventory) state.inventory = {}
    for (const vid of state.unlockedVarieties) {
      if (!state.inventory[vid]) state.inventory[vid] = mkInv()
    }

    // Migrate old saves that had flat grapes/barrels/wine but no per-variety inventory
    if (!loaded.inventory && (loaded.grapes > 0 || loaded.barrels > 0 || loaded.wine > 0)) {
      state.inventory.chardonnay = {
        grapes:  loaded.grapes  || 0,
        barrels: loaded.barrels || 0,
        wine:    loaded.wine    || 0,
      }
    }

    if (!state.adWorkers) state.adWorkers = { harvester: 0, presser: 0, cellarMgr: 0 }

    // Sync totals
    Object.assign(state, inv2totals(state.inventory))
    return state
  } catch {
    return initialState()
  }
}

function saveState(state) {
  try {
    const { visitor, offlineEarnings, notification, ...toSave } = state
    localStorage.setItem(SAVE_KEY, JSON.stringify(toSave))
  } catch {}
}

export const useGameStore = create((set, get) => ({
  ...loadState(),

  // ── Vineyard ─────────────────────────────────────────────────────────────────
  harvestVine(id) {
    set(s => {
      const vine = s.vines.find(v => v.id === id)
      if (!vine || vine.cooldown > 0) return {}
      const variety = GRAPE_VARIETIES.find(g => g.id === s.activeVariety) || GRAPE_VARIETIES[0]
      const harvested = gUpgVal(s.upgrades, 'vineYield') * variety.grapeValue
      SFX.harvest()
      const inv = s.inventory[s.activeVariety] || mkInv()
      const newInv = { ...s.inventory, [s.activeVariety]: { ...inv, grapes: inv.grapes + harvested } }
      const newVines = s.vines.map(v => v.id === id ? { ...v, cooldown: VINE_COOLDOWN } : v)
      const evProg = s.activeEvent?.type === 'harvest'
        ? (s.eventProgress || 0) + harvested : s.eventProgress
      return {
        inventory: newInv, ...inv2totals(newInv),
        grapeQueue: s.grapes + harvested, vines: newVines, eventProgress: evProg,
      }
    })
  },

  buyVineRow() {
    set(s => {
      const extraRows = s.vines.length - 4
      if (extraRows >= VINE_ROW_COSTS.length) return {}
      const cost = VINE_ROW_COSTS[extraRows]
      if (s.money < cost) return {}
      return { money: s.money - cost, vines: [...s.vines, { id: s.vines.length, cooldown: 0 }] }
    })
  },

  unlockVariety(varietyId) {
    set(s => {
      const variety = GRAPE_VARIETIES.find(v => v.id === varietyId)
      if (!variety || s.unlockedVarieties.includes(varietyId)) return {}
      if (variety.prem && !s.iapOwned.includes('seasonpass')) return {}
      if (!variety.prem && s.money < variety.unlockCost) return {}
      const newInv = { ...s.inventory, [varietyId]: s.inventory[varietyId] || mkInv() }
      return {
        money: variety.prem ? s.money : s.money - variety.unlockCost,
        unlockedVarieties: [...s.unlockedVarieties, varietyId],
        activeVariety: varietyId,
        inventory: newInv,
      }
    })
  },

  // ── Press House ──────────────────────────────────────────────────────────────
  pressGrapes(batches) {
    set(s => {
      if (s.pressQueue > 0) return {}  // already pressing
      const inv = s.inventory[s.activeVariety] || mkInv()
      const grapeCost = Math.max(5, GRAPES_PER_BARREL - gUpgVal(s.upgrades, 'pressSpeed'))
      const maxBatches = Math.floor(inv.grapes / grapeCost)
      const actual = Math.min(batches, maxBatches)
      if (actual <= 0) return {}
      SFX.press()
      const pressSecs = Math.max(3, PRESS_SECS - gUpgVal(s.upgrades, 'pressSpeed') * 0.5)
      const newInv = { ...s.inventory, [s.activeVariety]: { ...inv, grapes: inv.grapes - actual * grapeCost } }
      const evProg = s.activeEvent?.type === 'press'
        ? (s.eventProgress || 0) + actual : s.eventProgress
      return {
        inventory: newInv, ...inv2totals(newInv),
        pressQueue: actual, pressSecs, pressVariety: s.activeVariety, eventProgress: evProg,
      }
    })
  },

  // ── Cellar ───────────────────────────────────────────────────────────────────
  fermentBarrels(batches) {
    set(s => {
      if (s.fermentQueue > 0) return {}
      const inv = s.inventory[s.activeVariety] || mkInv()
      const actual = Math.min(batches, inv.barrels)
      if (actual <= 0) return {}
      SFX.bottle()
      const secs = Math.max(5, FERMENT_SECS - gUpgVal(s.upgrades, 'cellarSpeed'))
      const newInv = { ...s.inventory, [s.activeVariety]: { ...inv, barrels: inv.barrels - actual } }
      return {
        inventory: newInv, ...inv2totals(newInv),
        fermentQueue: actual, fermentSecs: secs, fermentVariety: s.activeVariety,
      }
    })
  },

  sellWine(amount) {
    set(s => {
      const inv = s.inventory[s.activeVariety] || mkInv()
      const qty = amount ?? inv.wine
      if (qty <= 0 || inv.wine <= 0) return {}
      const actual = Math.min(qty, inv.wine)
      const variety = GRAPE_VARIETIES.find(g => g.id === s.activeVariety) || GRAPE_VARIETIES[0]
      const sommelierMult = s.staff.sommelier
        ? STAFF_DEFS.sommelier.mults[(s.staff.sommelier - 1)] : 1
      const pricePerBottle = gUpgVal(s.upgrades, 'winePrice') * variety.wineMultiplier * sommelierMult
      const earned = Math.floor(actual * pricePerBottle)
      SFX.sell()
      const newInv = { ...s.inventory, [s.activeVariety]: { ...inv, wine: inv.wine - actual } }
      const evProg = s.activeEvent?.type === 'sell'
        ? (s.eventProgress || 0) + actual : s.eventProgress
      return {
        inventory: newInv, ...inv2totals(newInv),
        money: s.money + earned, fame: s.fame + Math.floor(earned / 150), eventProgress: evProg,
      }
    })
  },

  // ── Export ───────────────────────────────────────────────────────────────────
  startExport(cityId) {
    set(s => {
      const city = EXPORT_CITIES.find(c => c.id === cityId)
      const reputation = Math.floor(s.fame / 20)
      if (!city || reputation < city.repReq || s.exportActive) return {}
      const inv = s.inventory[s.activeVariety] || mkInv()
      if (inv.wine < city.minWine) return {}
      const variety = GRAPE_VARIETIES.find(g => g.id === s.activeVariety) || GRAPE_VARIETIES[0]
      const reward = Math.floor(inv.wine * gUpgVal(s.upgrades, 'winePrice') * variety.wineMultiplier * city.mult)
      const newInv = { ...s.inventory, [s.activeVariety]: { ...inv, wine: 0 } }
      return { inventory: newInv, ...inv2totals(newInv), exportActive: { cityId, secsLeft: city.baseSecs, reward } }
    })
  },

  // ── Shop ─────────────────────────────────────────────────────────────────────
  buyUpgrade(key) {
    set(s => {
      const cost = gUpgCost(s.upgrades, key)
      if (s.money < cost) return {}
      SFX.upgrade()
      return { money: s.money - cost, upgrades: { ...s.upgrades, [key]: (s.upgrades[key] || 0) + 1 } }
    })
  },

  buyStaff(key) {
    set(s => {
      const lvl = s.staff[key] || 0
      const cost = stkCost(key, lvl)
      if (s.money < cost) return {}
      SFX.upgrade()
      return { money: s.money - cost, staff: { ...s.staff, [key]: lvl + 1 } }
    })
  },

  // ── Ad Workers ───────────────────────────────────────────────────────────────
  watchAdWorker(key) {
    set(s => ({ adWorkers: { ...s.adWorkers, [key]: AD_WORKER_DURATION } }))
  },

  // ── Blend Lab ────────────────────────────────────────────────────────────────
  setBlend(slot, value) {
    if (slot === 'A') set({ blendA: value || null })
    else set({ blendB: value || null })
  },

  createBlend() {
    set(s => {
      if (!s.blendA || !s.blendB || s.wine < 2) return {}
      const key1 = `${s.blendA}+${s.blendB}`
      const key2 = `${s.blendB}+${s.blendA}`
      const bonus = BLEND_BONUS[key1] || BLEND_BONUS[key2] || 1.5
      const name = BLEND_NAMES[Math.floor(Math.random() * BLEND_NAMES.length)]
      const gained = Math.floor((s.wine - 2) * bonus + 2)
      const newInv = Object.fromEntries(
        Object.entries(s.inventory).map(([k, v]) => [k, { ...v, wine: 0 }])
      )
      newInv[s.activeVariety] = { ...(newInv[s.activeVariety] || mkInv()), wine: gained }
      return { inventory: newInv, ...inv2totals(newInv), blendResult: { name, bonus } }
    })
  },

  // ── Events / Daily ───────────────────────────────────────────────────────────
  claimEvent() {
    set(s => {
      if (!s.activeEvent || s.eventProgress < s.activeEvent.target) return {}
      return { money: s.money + s.activeEvent.reward.money, fame: s.fame + s.activeEvent.reward.fame, activeEvent: null }
    })
  },

  claimDaily() {
    set(s => {
      const today = new Date().toDateString()
      if (s.lastDaily === today) return {}
      const streak = (s.lastDaily === new Date(Date.now() - 86400000).toDateString())
        ? Math.min(s.dailyStreak + 1, 5) : 0
      const reward = DAILY_REWARDS[streak]
      const inv = s.inventory[s.activeVariety] || mkInv()
      const newInv = { ...s.inventory, [s.activeVariety]: {
        ...inv,
        grapes: inv.grapes + (reward.grapes || 0),
        wine:   inv.wine   + (reward.wine   || 0),
      }}
      return {
        inventory: newInv, ...inv2totals(newInv),
        money: s.money + (reward.money || 0), fame: s.fame + (reward.fame || 0),
        lastDaily: today, dailyStreak: streak,
      }
    })
  },

  watchAd() {
    set(s => {
      if (s.adActive) return {}
      return { money: s.money * 2, adActive: true, adTimer: AD_DURATION }
    })
  },

  acceptVisitor() {
    set(s => {
      if (!s.visitor) return {}
      const v = s.visitor
      const inv = { ...s.inventory }
      const activeInv = inv[s.activeVariety] || mkInv()

      // deduct wine cost if required
      if (v.costWine > 0) {
        if (activeInv.wine < v.costWine) return {}  // not enough wine, block
        inv[s.activeVariety] = { ...activeInv, wine: activeInv.wine - v.costWine }
      }

      if (v.type === 'sale3x') {
        // sell all wine across all varieties at saleMult price
        const mult = v.saleMult || 2
        let earned = 0
        const sommelierMult = s.staff.sommelier ? STAFF_DEFS.sommelier.mults[(s.staff.sommelier - 1)] : 1
        for (const [vid, vinv] of Object.entries(inv)) {
          if (!vinv.wine) continue
          const variety = GRAPE_VARIETIES.find(g => g.id === vid) || GRAPE_VARIETIES[0]
          const price = gUpgVal(s.upgrades, 'winePrice') * variety.wineMultiplier * sommelierMult * mult
          earned += Math.floor(vinv.wine * price)
          inv[vid] = { ...vinv, wine: 0 }
        }
        SFX.sell()
        return { visitor: null, inventory: inv, ...inv2totals(inv), money: s.money + earned }
      }

      if (v.type === 'rep') {
        // +1 reputation = +20 fame, costs wine (already deducted above)
        return { visitor: null, inventory: inv, ...inv2totals(inv), fame: s.fame + 20 }
      }

      // cash / invest types
      return {
        visitor: null,
        inventory: inv, ...inv2totals(inv),
        money: s.money + (v.cash || 0),
        fame: s.fame + (v.fame || 0),
      }
    })
  },

  // ── Prestige ─────────────────────────────────────────────────────────────────
  prestige() {
    set(s => {
      if (s.fame < 1000) return {}
      SFX.prestige()
      return { ...initialState(), prestigeLvl: s.prestigeLvl + 1, money: 200 + s.prestigeLvl * 50 }
    })
  },

  // ── Misc ─────────────────────────────────────────────────────────────────────
  setTab(t) { SFX.tab(); set({ tab: t }) },

  notify(msg) {
    set({ notification: msg })
    setTimeout(() => set({ notification: null }), 3000)
  },

  tick() { set(s => gameTick(s)) },

  dismissOffline() { set({ offlineEarnings: null }) },
  resetGame() { localStorage.removeItem(SAVE_KEY); set(initialState()) },
}))

// Auto-save every 10 seconds
setInterval(() => saveState(useGameStore.getState()), 10000)

// ── Tick logic ────────────────────────────────────────────────────────────────
function gameTick(s) {
  const dt = 0.25
  let ns = { ...s, tickCount: (s.tickCount || 0) + 1 }
  const inv = { ...ns.inventory }  // mutable working copy

  // Vine cooldowns
  ns.vines = ns.vines.map(v =>
    v.cooldown > 0 ? { ...v, cooldown: Math.max(0, v.cooldown - dt) } : v
  )

  // Prestige bonus multiplier (+10% per level)
  const prestigeBonus = 1 + (ns.prestigeLvl || 0) * 0.1

  const variety = GRAPE_VARIETIES.find(g => g.id === ns.activeVariety) || GRAPE_VARIETIES[0]
  const yieldMult = gUpgVal(ns.upgrades, 'vineYield')
  if (!inv[ns.activeVariety]) inv[ns.activeVariety] = mkInv()

  // ── Staff harvester + ad harvester (auto-harvests ready vines via vine cooldown) ──
  const hLvl = ns.staff.harvester || 0
  const adHarv = (ns.adWorkers?.harvester || 0) > 0
  if (hLvl > 0 || adHarv) {
    const vineLimit = hLvl > 0 ? STAFF_DEFS.harvester.vines[hLvl - 1] : ns.vines.length
    let totalHarvested = 0
    ns.vines = ns.vines.map((v, idx) => {
      if (idx >= vineLimit || v.cooldown > 0) return v
      totalHarvested += gUpgVal(ns.upgrades, 'vineYield') * variety.grapeValue * prestigeBonus
      return { ...v, cooldown: VINE_COOLDOWN }
    })
    if (totalHarvested > 0) {
      inv[ns.activeVariety] = {
        ...inv[ns.activeVariety],
        grapes: inv[ns.activeVariety].grapes + totalHarvested,
      }
      if (ns.activeEvent?.type === 'harvest') {
        ns.eventProgress = (ns.eventProgress || 0) + totalHarvested
      }
    }
  }

  // ── Press cooldown timer ──
  if (ns.pressQueue > 0) {
    ns.pressSecs -= dt
    if (ns.pressSecs <= 0) {
      const pv = ns.pressVariety || ns.activeVariety
      if (!inv[pv]) inv[pv] = mkInv()
      inv[pv] = { ...inv[pv], barrels: inv[pv].barrels + ns.pressQueue }
      ns.pressQueue = 0; ns.pressSecs = 0; ns.pressVariety = null
      SFX.press()
    }
  }

  // ── Staff presser + ad presser (both via press cooldown) ──
  const pLvl = ns.staff.presser || 0
  const adPress = (ns.adWorkers?.presser || 0) > 0
  if ((pLvl > 0 || adPress) && ns.pressQueue === 0) {
    const grapeCost = Math.max(5, GRAPES_PER_BARREL - gUpgVal(ns.upgrades, 'pressSpeed'))
    const maxBatches = Math.floor(inv[ns.activeVariety].grapes / grapeCost)
    const batchCount = pLvl > 0 ? STAFF_DEFS.presser.batches[pLvl - 1] : maxBatches
    const actual = Math.min(batchCount, maxBatches)
    if (actual > 0) {
      inv[ns.activeVariety] = { ...inv[ns.activeVariety], grapes: inv[ns.activeVariety].grapes - actual * grapeCost }
      ns.pressQueue = actual
      ns.pressSecs = Math.max(3, PRESS_SECS - gUpgVal(ns.upgrades, 'pressSpeed') * 0.5)
      ns.pressVariety = ns.activeVariety
      if (ns.activeEvent?.type === 'press') ns.eventProgress = (ns.eventProgress || 0) + actual
    }
  }

  // ── Fermentation timer ──
  if (ns.fermentQueue > 0) {
    ns.fermentSecs -= dt
    if (ns.fermentSecs <= 0) {
      const fv = ns.fermentVariety || ns.activeVariety
      const fVariety = GRAPE_VARIETIES.find(g => g.id === fv) || GRAPE_VARIETIES[0]
      if (!inv[fv]) inv[fv] = mkInv()
      inv[fv] = { ...inv[fv], wine: inv[fv].wine + ns.fermentQueue * fVariety.wineMultiplier }
      ns.fermentQueue = 0; ns.fermentSecs = 0; ns.fermentVariety = null
      SFX.bottle()
    }
  }

  // ── Staff cellarMgr + ad cellarMgr (via ferment cooldown) ──
  const cLvl = ns.staff.cellarMgr || 0
  const adCellar = (ns.adWorkers?.cellarMgr || 0) > 0
  if ((cLvl > 0 || adCellar) && ns.fermentQueue === 0 && inv[ns.activeVariety].barrels > 0) {
    const batchSize = cLvl > 0 ? STAFF_DEFS.cellarMgr.mults[cLvl - 1] : inv[ns.activeVariety].barrels
    const batch = Math.min(batchSize, inv[ns.activeVariety].barrels)
    inv[ns.activeVariety] = { ...inv[ns.activeVariety], barrels: inv[ns.activeVariety].barrels - batch }
    ns.fermentQueue = batch
    ns.fermentSecs = Math.max(5, FERMENT_SECS - gUpgVal(ns.upgrades, 'cellarSpeed'))
    ns.fermentVariety = ns.activeVariety
  }

  // ── Export timer ──
  if (ns.exportActive) {
    ns.exportActive = { ...ns.exportActive, secsLeft: ns.exportActive.secsLeft - dt }
    if (ns.exportActive.secsLeft <= 0) {
      ns.money += ns.exportActive.reward
      ns.fame  += Math.floor(ns.exportActive.reward / 100)
      if (ns.activeEvent?.type === 'export') ns.eventProgress = (ns.eventProgress || 0) + 1
      ns.exportActive = null
      SFX.sell()
    }
  }

  // ── Active event countdown ──
  if (ns.activeEvent) {
    ns.eventSecs -= dt
    if (ns.eventSecs <= 0 && ns.eventProgress < ns.activeEvent.target) ns.activeEvent = null
  } else if (ns.tickCount % 480 === 1) {
    ns.activeEvent = EVENTS_LIST[Math.floor(Math.random() * EVENTS_LIST.length)]
    ns.eventSecs = ns.activeEvent.secs
    ns.eventProgress = 0
  }

  // ── Visitor spawn ──
  ns.visitorTimer -= dt
  if (ns.visitorTimer <= 0 && !ns.visitor) {
    ns.visitor = VISITOR_POOL[Math.floor(Math.random() * VISITOR_POOL.length)]
    ns.visitorTimer = 300 + Math.random() * 300
  }

  // ── Ad workers countdown ──
  if (ns.adWorkers) {
    ns.adWorkers = {
      harvester: Math.max(0, (ns.adWorkers.harvester || 0) - dt),
      presser:   Math.max(0, (ns.adWorkers.presser   || 0) - dt),
      cellarMgr: Math.max(0, (ns.adWorkers.cellarMgr || 0) - dt),
    }
  }

  if (ns.adActive) { ns.adTimer -= dt; if (ns.adTimer <= 0) ns.adActive = false }

  // ── Commit inventory and sync totals ──
  ns.inventory = inv
  const totals = inv2totals(inv)
  ns.grapes  = totals.grapes
  ns.barrels = totals.barrels
  ns.wine    = totals.wine
  ns.grapeQueue = ns.grapes

  return ns
}

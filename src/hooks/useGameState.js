import { create } from 'zustand'
import {
  GRAPE_VARIETIES, UPGRADE_DEFS, STAFF_DEFS, EXPORT_CITIES,
  VINE_COOLDOWN, GRAPES_PER_BARREL, FERMENT_SECS,
  EVENTS_LIST, DAILY_REWARDS, VISITOR_POOL,
  BLEND_NAMES, BLEND_BONUS, AD_DURATION,
  fmt, mmss, gUpgVal, gUpgCost, stkCost
} from '../constants/game.js'
import { SFX } from '../audio/sfx.js'

export { fmt, mmss }

const SAVE_KEY = 'vineyardIdle_v2'

function initialState() {
  return {
    money: 50,
    grapes: 0,
    barrels: 0,
    wine: 0,
    fame: 0,
    prestige: 0,
    activeVariety: 'chardonnay',
    unlockedVarieties: ['chardonnay'],
    upgrades: {},
    staff: {},
    // vines: array of { id, cooldown } — cooldown in seconds remaining
    vines: Array.from({ length: 4 }, (_, i) => ({ id: i, cooldown: 0 })),
    // fermentation in cellar
    fermentQueue: 0,
    fermentSecs: 0,
    // export
    exportActive: null,
    // events
    activeEvent: null, eventSecs: 0, eventProgress: 0,
    // daily / visitor
    lastDaily: null, dailyStreak: 0,
    visitor: null, visitorTimer: 0,
    // ads / blend
    adTimer: 0, adActive: false,
    blendA: null, blendB: null, blendResult: null,
    iapOwned: [],
    notification: null,
    tab: 'home',
    tickCount: 0,
    // derived (synced by gameTick)
    grapeQueue: 0,
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return initialState()
    return { ...initialState(), ...JSON.parse(raw) }
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

  // ── Vineyard ───────────────────────────────────────────────────────────────
  harvestVine(id) {
    set(s => {
      const vine = s.vines.find(v => v.id === id)
      if (!vine || vine.cooldown > 0) return {}
      const variety = GRAPE_VARIETIES.find(g => g.id === s.activeVariety) || GRAPE_VARIETIES[0]
      const harvested = gUpgVal(s.upgrades, 'vineYield') * variety.grapeValue
      SFX.harvest()
      const newGrapes = s.grapes + harvested
      const newVines = s.vines.map(v => v.id === id ? { ...v, cooldown: VINE_COOLDOWN } : v)
      return { grapes: newGrapes, grapeQueue: newGrapes, vines: newVines }
    })
  },

  // ── Press House ────────────────────────────────────────────────────────────
  pressGrapes(batches) {
    set(s => {
      const grapeCost = Math.max(5, GRAPES_PER_BARREL - gUpgVal(s.upgrades, 'pressSpeed'))
      const maxBatches = Math.floor(s.grapes / grapeCost)
      const actual = Math.min(batches, maxBatches)
      if (actual <= 0) return {}
      SFX.press()
      const newGrapes = s.grapes - actual * grapeCost
      return { grapes: newGrapes, grapeQueue: newGrapes, barrels: s.barrels + actual }
    })
  },

  // ── Cellar ─────────────────────────────────────────────────────────────────
  fermentBarrels(batches) {
    set(s => {
      if (s.fermentQueue > 0) return {} // already fermenting
      const actual = Math.min(batches, s.barrels)
      if (actual <= 0) return {}
      SFX.bottle()
      const secs = Math.max(5, FERMENT_SECS - gUpgVal(s.upgrades, 'cellarSpeed'))
      return { fermentQueue: actual, fermentSecs: secs, barrels: s.barrels - actual }
    })
  },

  sellWine(amount) {
    set(s => {
      const qty = amount ?? s.wine
      if (qty <= 0 || s.wine <= 0) return {}
      const actual = Math.min(qty, s.wine)
      const variety = GRAPE_VARIETIES.find(g => g.id === s.activeVariety) || GRAPE_VARIETIES[0]
      const sommelierMult = s.staff.sommelier
        ? STAFF_DEFS.sommelier.mults[(s.staff.sommelier - 1)] : 1
      const pricePerBottle = gUpgVal(s.upgrades, 'winePrice') * variety.wineMultiplier * sommelierMult
      const earned = Math.floor(actual * pricePerBottle)
      SFX.sell()
      return { money: s.money + earned, wine: s.wine - actual, fame: s.fame + Math.floor(earned / 150) }
    })
  },

  // ── Export ─────────────────────────────────────────────────────────────────
  startExport(cityId) {
    set(s => {
      const city = EXPORT_CITIES.find(c => c.id === cityId)
      const reputation = Math.floor(s.fame / 20)
      if (!city || s.wine < city.minWine || reputation < city.repReq || s.exportActive) return {}
      const variety = GRAPE_VARIETIES.find(g => g.id === s.activeVariety) || GRAPE_VARIETIES[0]
      const reward = Math.floor(s.wine * gUpgVal(s.upgrades, 'winePrice') * variety.wineMultiplier * city.mult)
      return { exportActive: { cityId, secsLeft: city.baseSecs, reward }, wine: 0 }
    })
  },

  // ── Shop ───────────────────────────────────────────────────────────────────
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

  // ── Blend Lab ──────────────────────────────────────────────────────────────
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
      return { wine: gained, blendResult: { name, bonus } }
    })
  },

  // ── Events / Daily ─────────────────────────────────────────────────────────
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
      return {
        money:  s.money  + (reward.money  || 0),
        grapes: s.grapes + (reward.grapes || 0),
        wine:   s.wine   + (reward.wine   || 0),
        fame:   s.fame   + (reward.fame   || 0),
        lastDaily: today,
        dailyStreak: streak,
      }
    })
  },

  watchAd() {
    set(s => ({ money: s.money * 2, adActive: true, adTimer: AD_DURATION }))
  },

  acceptVisitor() {
    set(s => {
      if (!s.visitor) return {}
      const v = s.visitor
      return { visitor: null, money: s.money + (v.cash || 0), fame: s.fame + (v.fame || 0) }
    })
  },

  // ── Prestige ───────────────────────────────────────────────────────────────
  prestige() {
    set(s => {
      if (s.fame < 1000) return {}
      SFX.prestige()
      return { ...initialState(), prestige: s.prestige + 1, money: 200 + s.prestige * 50 }
    })
  },

  // ── Misc ───────────────────────────────────────────────────────────────────
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

  // Vine cooldowns
  ns.vines = ns.vines.map(v =>
    v.cooldown > 0 ? { ...v, cooldown: Math.max(0, v.cooldown - dt) } : v
  )

  // Staff: harvester — auto-harvests ready vines
  const hLvl = ns.staff.harvester || 0
  if (hLvl > 0) {
    const variety = GRAPE_VARIETIES.find(g => g.id === ns.activeVariety) || GRAPE_VARIETIES[0]
    const yieldMult = gUpgVal(ns.upgrades, 'vineYield')
    const rate = STAFF_DEFS.harvester.rates[hLvl - 1]  // grapes/second
    ns.grapes += rate * dt * variety.grapeValue * yieldMult
  }

  // Staff: presser — auto-presses grapes into barrels
  const pLvl = ns.staff.presser || 0
  if (pLvl > 0) {
    const grapeCost = Math.max(5, GRAPES_PER_BARREL - gUpgVal(ns.upgrades, 'pressSpeed'))
    const pressRate = STAFF_DEFS.presser.mults[pLvl - 1] * dt  // barrels per tick
    if (ns.grapes >= grapeCost && Math.random() < pressRate) {
      ns.grapes -= grapeCost
      ns.barrels += 1
    }
  }

  // Fermentation timer
  if (ns.fermentQueue > 0) {
    ns.fermentSecs -= dt
    if (ns.fermentSecs <= 0) {
      const variety = GRAPE_VARIETIES.find(g => g.id === ns.activeVariety) || GRAPE_VARIETIES[0]
      ns.wine += ns.fermentQueue * variety.wineMultiplier
      ns.fermentQueue = 0
      ns.fermentSecs = 0
      SFX.bottle()
    }
  }

  // Staff: cellarMgr — auto-starts fermentation when idle
  const cLvl = ns.staff.cellarMgr || 0
  if (cLvl > 0 && ns.barrels > 0 && ns.fermentQueue === 0) {
    const batch = Math.min(STAFF_DEFS.cellarMgr.mults[cLvl - 1], ns.barrels)
    ns.barrels -= batch
    ns.fermentQueue = batch
    ns.fermentSecs = Math.max(5, FERMENT_SECS - gUpgVal(ns.upgrades, 'cellarSpeed'))
  }

  // Export timer
  if (ns.exportActive) {
    ns.exportActive = { ...ns.exportActive, secsLeft: ns.exportActive.secsLeft - dt }
    if (ns.exportActive.secsLeft <= 0) {
      ns.money += ns.exportActive.reward
      ns.fame  += Math.floor(ns.exportActive.reward / 100)
      ns.exportActive = null
      SFX.sell()
    }
  }

  // Active event countdown
  if (ns.activeEvent) {
    ns.eventSecs -= dt
    if (ns.eventSecs <= 0) ns.activeEvent = null
  } else if (ns.tickCount % 480 === 1) {
    ns.activeEvent = EVENTS_LIST[Math.floor(Math.random() * EVENTS_LIST.length)]
    ns.eventSecs = ns.activeEvent.secs
    ns.eventProgress = 0
  }

  // Visitor spawn
  ns.visitorTimer -= dt
  if (ns.visitorTimer <= 0 && !ns.visitor) {
    ns.visitor = VISITOR_POOL[Math.floor(Math.random() * VISITOR_POOL.length)]
    ns.visitorTimer = 120 + Math.random() * 180
  }

  if (ns.adActive) { ns.adTimer -= dt; if (ns.adTimer <= 0) ns.adActive = false }

  // Keep derived fields in sync
  ns.grapeQueue = ns.grapes

  return ns
}

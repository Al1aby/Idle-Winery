import { create } from 'zustand'
import {
  GRAPE_VARIETIES, UPGRADE_DEFS, STAFF_DEFS, EXPORT_CITIES,
  SEASONS_DATA, EVENTS_LIST, DAILY_REWARDS, VISITOR_POOL,
  BLEND_NAMES, BLEND_BONUS, AD_DURATION,
  fmt, mmss, gUpgVal, gUpgCost, stkCost
} from '../constants/game.js'
import { SFX } from '../audio/sfx.js'

export { fmt, mmss }

const SAVE_KEY = 'vineyardIdle_v1'
const SEASON_SECS = 180

function initialState() {
  return {
    money: 50, grapes: 0, juice: 0, wine: 0, fame: 0, prestige: 0,
    activeVariety: 'chardonnay',
    unlockedVarieties: ['chardonnay'],
    upgrades: {}, staff: {},
    // exportActive = null | { cityId, secsLeft, reward }
    exportActive: null,
    season: 0, seasonTimer: 0,
    activeEvent: null, eventTimer: 0, eventProgress: 0, eventSecs: 0,
    lastDaily: null, dailyStreak: 0,
    visitor: null, visitorTimer: 0,
    adTimer: 0, adActive: false,
    blendA: null, blendB: null, blendActive: false, blendTimer: 0, blendWine: 0,
    // blendResult = null | { name, bonus }
    blendResult: null,
    iapOwned: [],
    notification: null,
    tab: 'home',
    tickCount: 0,
    // derived / alias fields kept in sync by gameTick
    seasonIdx: 0,
    seasonSecs: SEASON_SECS,
    grapeQueue: 0,
    pressQueue: 0,
    pressSecs: 0,
    cellarQueue: 0,
    cellarSecs: 0,
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

  // ── Actions ───────────────────────────────────────────────────────────────
  harvestGrapes() {
    set(s => {
      const v = GRAPE_VARIETIES.find(g => g.id === s.activeVariety) || GRAPE_VARIETIES[0]
      const rate = gUpgVal(s.upgrades, 'vineYield') * v.grapeValue * (SEASONS_DATA[s.season]?.hMult || 1)
      SFX.harvest()
      const newGrapes = s.grapes + rate
      return { grapes: newGrapes, grapeQueue: newGrapes }
    })
  },

  startPress() {
    set(s => {
      const rate = Math.max(1, gUpgVal(s.upgrades, 'pressSpeed'))
      const pressed = Math.min(s.grapes, rate)
      if (pressed <= 0) return {}
      SFX.press()
      const newGrapes = s.grapes - pressed
      const newJuice  = s.juice + pressed
      return { grapes: newGrapes, juice: newJuice, grapeQueue: newGrapes, cellarQueue: Math.floor(newJuice) }
    })
  },

  cellar() {
    set(s => {
      const rate = Math.max(1, gUpgVal(s.upgrades, 'cellarSpeed'))
      const bottled = Math.min(s.juice, rate)
      if (bottled <= 0) return {}
      SFX.bottle()
      return { juice: s.juice - bottled, wine: s.wine + bottled }
    })
  },

  sellWine(amount) {
    set(s => {
      const qty = amount ?? s.wine
      if (qty <= 0 || s.wine <= 0) return {}
      const actual = Math.min(qty, s.wine)
      const winePrice = gUpgVal(s.upgrades, 'winePrice') + 1
      const earned = Math.floor(actual * winePrice * (SEASONS_DATA[s.season]?.wBonus || 1) + actual)
      SFX.sell()
      return { money: s.money + earned, wine: s.wine - actual, fame: s.fame + Math.floor(earned / 150) }
    })
  },

  startExport(cityId) {
    set(s => {
      const city = EXPORT_CITIES.find(c => c.id === cityId)
      const reputation = Math.floor(s.fame / 20)
      if (!city || s.wine < city.minWine || reputation < city.repReq || s.exportActive) return {}
      const reward = Math.floor(s.wine * (gUpgVal(s.upgrades, 'winePrice') + 1) * city.mult)
      return {
        exportActive: { cityId, secsLeft: city.baseSecs, reward },
        wine: 0,
      }
    })
  },

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
      const streak = (s.lastDaily === new Date(Date.now() - 86400000).toDateString()) ? Math.min(s.dailyStreak + 1, 5) : 0
      const reward = DAILY_REWARDS[streak]
      return { money: s.money + (reward.money || 0), grapes: s.grapes + (reward.grapes || 0), wine: s.wine + (reward.wine || 0), fame: s.fame + (reward.fame || 0), lastDaily: today, dailyStreak: streak }
    })
  },

  watchAd() {
    set(s => ({ money: s.money * 2, adActive: true, adTimer: AD_DURATION }))
  },

  acceptVisitor() {
    set(s => {
      if (!s.visitor) return {}
      const v = s.visitor
      return {
        visitor: null,
        money: s.money + (v.cash || 0),
        fame: s.fame + (v.fame || 0),
      }
    })
  },

  prestige() {
    set(s => {
      if (s.fame < 1000) return {}
      SFX.prestige()
      return {
        ...initialState(),
        prestige: s.prestige + 1,
        money: 200 + s.prestige * 50,
      }
    })
  },

  setTab(t) {
    SFX.tab()
    set({ tab: t })
  },

  notify(msg) {
    set({ notification: msg })
    setTimeout(() => set({ notification: null }), 3000)
  },

  tick() {
    set(s => gameTick(s))
  },

  dismissOffline() { set({ offlineEarnings: null }) },
  resetGame() { localStorage.removeItem(SAVE_KEY); set(initialState()) },
}))

// Auto-save every 10 seconds
setInterval(() => saveState(useGameStore.getState()), 10000)

// ── Tick logic ────────────────────────────────────────────────────────────────
function gameTick(s) {
  const dt = 0.25
  let ns = { ...s, tickCount: (s.tickCount || 0) + 1 }

  // Season
  ns.seasonTimer += dt
  if (ns.seasonTimer >= SEASON_SECS) { ns.seasonTimer = 0; ns.season = (ns.season + 1) % 4 }
  const season = SEASONS_DATA[ns.season]

  // Staff automation
  const hLvl = ns.staff.harvester || 0
  const pLvl = ns.staff.presser   || 0
  const cLvl = ns.staff.cellarMgr || 0
  if (hLvl > 0) { ns.grapes += hLvl * 0.5 * (season?.hMult || 1) }
  if (pLvl > 0) { const p = Math.min(ns.grapes, pLvl * 0.5); ns.grapes -= p; ns.juice += p }
  if (cLvl > 0) { const b = Math.min(ns.juice, cLvl * 0.5); ns.juice -= b; ns.wine += b }

  // Export timer
  if (ns.exportActive) {
    ns.exportActive = { ...ns.exportActive, secsLeft: ns.exportActive.secsLeft - dt }
    if (ns.exportActive.secsLeft <= 0) {
      ns.money += ns.exportActive.reward
      ns.fame += Math.floor(ns.exportActive.reward / 100)
      ns.exportActive = null
      SFX.sell()
    }
  }

  // Active event
  if (ns.activeEvent) {
    ns.eventTimer -= dt
    if (ns.eventTimer <= 0) { ns.activeEvent = null }
  } else if (ns.tickCount % 480 === 1) {
    ns.activeEvent = EVENTS_LIST[Math.floor(Math.random() * EVENTS_LIST.length)]
    ns.eventTimer = ns.activeEvent.secs
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
  ns.seasonIdx  = ns.season
  ns.seasonSecs = Math.max(0, SEASON_SECS - ns.seasonTimer)
  ns.grapeQueue = ns.grapes
  ns.cellarQueue = Math.floor(ns.juice)

  return ns
}

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

function initialState() {
  return {
    money: 50, grapes: 0, juice: 0, wine: 0, fame: 0, prestige: 0,
    winePrice: 12, harvestRate: 1, pressRate: 1, cellarRate: 1,
    selectedGrape: 'chardonnay', ownedGrapes: ['chardonnay'],
    unlockedVarieties: ['chardonnay'],
    upgrades: {}, staff: {},
    exportCity: null, exportTimer: 0, exportActive: false,
    season: 0, seasonTimer: 0, seasonIdx: 0,
    activeEvent: null, eventTimer: 0, eventProgress: 0, eventSecs: 0,
    lastDaily: null, dailyStreak: 0,
    visitor: null, visitorTimer: 0,
    adTimer: 0, adActive: false,
    blendA: null, blendB: null, blendActive: false, blendTimer: 0, blendWine: 0, blendResult: null,
    cellarQueue: [], cellarSecs: 0,
    reputation: 0, offlineEarnings: null,
    prestigeUnlocks: [],
    iapOwned: [],
    notification: null,
    tab: 'home',
    tickCount: 0,
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

  // ── Actions ──────────────────────────────────────────────────────────────
  harvest() {
    set(s => {
      const rate = gUpgVal(s.upgrades, 'vineYield') * (SEASONS_DATA[s.season]?.hMult || 1)
      SFX.harvest()
      return { grapes: s.grapes + rate }
    })
  },

  press() {
    set(s => {
      const rate = gUpgVal(s.upgrades, 'pressSpeed')
      const pressed = Math.min(s.grapes, rate)
      if (pressed <= 0) return {}
      SFX.press()
      return { grapes: s.grapes - pressed, juice: s.juice + pressed }
    })
  },

  cellar() {
    set(s => {
      const rate = gUpgVal(s.upgrades, 'cellarSpeed')
      const bottled = Math.min(s.juice, rate)
      if (bottled <= 0) return {}
      SFX.bottle()
      return { juice: s.juice - bottled, wine: s.wine + bottled }
    })
  },

  sellWine() {
    set(s => {
      if (s.wine <= 0) return {}
      const earned = Math.floor(s.wine * s.winePrice * (SEASONS_DATA[s.season]?.wBonus || 1))
      SFX.sell()
      return { money: s.money + earned, wine: 0, fame: s.fame + Math.floor(earned / 150), reputation: Math.min(5, s.reputation + 0.05) }
    })
  },

  startExport(cityId) {
    set(s => {
      const city = EXPORT_CITIES.find(c => c.id === cityId)
      if (!city || s.wine < city.minWine || s.reputation < city.repReq) return {}
      return { exportCity: cityId, exportTimer: city.secs, exportActive: true }
    })
  },

  buyUpgrade(key) {
    set(s => {
      const cost = gUpgCost(s.upgrades, key)
      if (s.money < cost) return {}
      SFX.upgrade()
      const upgrades = { ...s.upgrades, [key]: (s.upgrades[key] || 0) + 1 }
      return { money: s.money - cost, upgrades }
    })
  },

  hireStaff(key) {
    set(s => {
      const lvl = s.staff[key] || 0
      const cost = stkCost(key, lvl)
      if (s.money < cost) return {}
      SFX.upgrade()
      return { money: s.money - cost, staff: { ...s.staff, [key]: lvl + 1 } }
    })
  },

  buyGrape(id) {
    set(s => {
      const g = GRAPE_VARIETIES.find(v => v.id === id)
      if (!g || s.money < g.cost || s.ownedGrapes.includes(id)) return {}
      return { money: s.money - g.cost, ownedGrapes: [...s.ownedGrapes, id], unlockedVarieties: [...s.unlockedVarieties, id], selectedGrape: id }
    })
  },

  setBlend(slot, value) {
    if (slot === 'A') set({ blendA: value })
    else set({ blendB: value })
  },

  createBlend() {
    set(s => {
      if (!s.blendA || !s.blendB || s.wine < 10) return {}
      const key = [s.blendA, s.blendB].sort().join('_')
      const bonus = BLEND_BONUS[key] || 1.1
      const blendWine = Math.floor(s.wine * bonus)
      return { wine: 0, blendActive: true, blendTimer: 30, blendWine, blendResult: key }
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
      const streak = (s.lastDaily === new Date(Date.now() - 86400000).toDateString()) ? Math.min(s.dailyStreak + 1, 6) : 0
      const reward = DAILY_REWARDS[streak]
      return { money: s.money + reward.money, lastDaily: today, dailyStreak: streak }
    })
  },

  watchAd() {
    set(s => ({ money: s.money * 2, adActive: true, adTimer: AD_DURATION }))
  },

  acceptVisitor() {
    set(s => {
      if (!s.visitor) return {}
      const v = s.visitor
      return { visitor: null, money: s.money + (v.reward?.money || 0), fame: s.fame + (v.reward?.fame || 0) }
    })
  },

  prestige() {
    set(s => {
      if (s.fame < 1000) return {}
      SFX.prestige()
      return {
        ...initialState(),
        prestige: s.prestige + 1,
        prestigeUnlocks: [...s.prestigeUnlocks, `prestige_${s.prestige + 1}`],
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

  ns.seasonTimer += dt
  if (ns.seasonTimer >= 180) { ns.seasonTimer = 0; ns.season = (ns.season + 1) % 4; ns.seasonIdx = ns.season }
  const season = SEASONS_DATA[ns.season]

  const hLvl = ns.staff.harvester || 0
  const pLvl = ns.staff.presser   || 0
  const cLvl = ns.staff.cellarMgr || 0
  const sLvl = ns.staff.sommelier || 0
  if (hLvl > 0) { const rate = hLvl * 0.5 * (season?.hMult || 1); ns.grapes += rate }
  if (pLvl > 0) { const rate = pLvl * 0.5; const p = Math.min(ns.grapes, rate); ns.grapes -= p; ns.juice += p }
  if (cLvl > 0) { const rate = cLvl * 0.5; const b = Math.min(ns.juice, rate); ns.juice -= b; ns.wine += b }
  if (sLvl > 0) { ns.winePrice = (gUpgVal(ns.upgrades, 'winePrice') + sLvl * 0.25) * (season?.wBonus || 1) }

  if (ns.exportActive && ns.exportCity) {
    ns.exportTimer -= dt
    if (ns.exportTimer <= 0) {
      const city = EXPORT_CITIES.find(c => c.id === ns.exportCity)
      if (city) {
        const earned = Math.floor(ns.wine * ns.winePrice * city.mult)
        ns.money += earned; ns.fame += Math.floor(earned / 100)
        ns.reputation = Math.min(5, ns.reputation + 0.1)
        ns.wine = 0; ns.exportActive = false; ns.exportCity = null
        SFX.sell()
      }
    }
  }

  if (ns.activeEvent) {
    ns.eventTimer -= dt
    if (ns.eventTimer <= 0) { ns.activeEvent = null }
  } else if (ns.tickCount % 480 === 0) {
    ns.activeEvent = EVENTS_LIST[Math.floor(Math.random() * EVENTS_LIST.length)]
    ns.eventTimer = ns.activeEvent.secs
    ns.eventSecs = ns.activeEvent.secs
    ns.eventProgress = 0
  }

  ns.visitorTimer -= dt
  if (ns.visitorTimer <= 0 && !ns.visitor) {
    ns.visitor = VISITOR_POOL[Math.floor(Math.random() * VISITOR_POOL.length)]
    ns.visitorTimer = 120 + Math.random() * 180
  }

  if (ns.adActive) { ns.adTimer -= dt; if (ns.adTimer <= 0) ns.adActive = false }

  if (ns.blendActive) {
    ns.blendTimer -= dt
    if (ns.blendTimer <= 0) { ns.blendActive = false; ns.wine += ns.blendWine; ns.blendWine = 0 }
  }

  return ns
}

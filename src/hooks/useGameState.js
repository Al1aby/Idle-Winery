// useGameState — all game logic lives here.
// Extracted from the monolithic VineyardIdle.jsx.
// In future: migrate to Zustand store (see store/gameStore.js stub).

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  GRAPE_VARIETIES, UPGRADE_DEFS, STAFF_DEFS, EXPORT_CITIES,
  SEASONS_DATA, EVENTS_LIST, DAILY_REWARDS, VISITOR_POOL,
  BLEND_NAMES, BLEND_BONUS, AD_DURATION,
  fmt, mmss, gUpgVal, gUpgCost, stkCost
} from '../constants/gameData.js'
import { SFX } from '../audio/sfx.js'

// Re-export helpers so components can import from one place
export { fmt, mmss }

// ── Initial state factory ─────────────────────────────────────────────────────
function initialState() {
  return {
    money: 50, grapes: 0, juice: 0, wine: 0, fame: 0, prestige: 0,
    winePrice: 12, harvestRate: 1, pressRate: 1, cellarRate: 1,
    selectedGrape: 'chardonnay', ownedGrapes: ['chardonnay'],
    upgrades: {}, staff: {},
    exportCity: null, exportTimer: 0, exportActive: false,
    season: 0, seasonTimer: 0,
    activeEvent: null, eventTimer: 0, eventProgress: 0,
    lastDaily: null, dailyStreak: 0,
    visitor: null, visitorTimer: 0,
    adTimer: 0, adActive: false,
    blendA: null, blendB: null, blendActive: false, blendTimer: 0, blendWine: 0,
    reputation: 0, offlineEarnings: null,
    prestigeUnlocks: [],
    iapOwned: [],
    tab: 'home',
    tick: 0,
  }
}

// ── Load / save ───────────────────────────────────────────────────────────────
const SAVE_KEY = 'vineyardIdle_v1'

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
    const { visitor, offlineEarnings, ...toSave } = state
    localStorage.setItem(SAVE_KEY, JSON.stringify(toSave))
  } catch {}
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useGameState() {
  const [gs, setGs] = useState(() => loadState())
  const gsRef = useRef(gs)
  gsRef.current = gs

  // Auto-save every 10 seconds
  useEffect(() => {
    const id = setInterval(() => saveState(gsRef.current), 10000)
    return () => clearInterval(id)
  }, [])

  // Game tick — 250ms
  useEffect(() => {
    const id = setInterval(() => {
      setGs(prev => tick(prev))
    }, 250)
    return () => clearInterval(id)
  }, [])

  // Actions
  const harvest   = useCallback(() => setGs(s => doHarvest(s)), [])
  const press     = useCallback(() => setGs(s => doPress(s)), [])
  const cellar    = useCallback(() => setGs(s => doCellar(s)), [])
  const sell      = useCallback(() => setGs(s => doSell(s)), [])
  const startExport = useCallback((city) => setGs(s => doStartExport(s, city)), [])
  const buyUpgrade  = useCallback((key) => setGs(s => doBuyUpgrade(s, key)), [])
  const hireStaff   = useCallback((key) => setGs(s => doHireStaff(s, key)), [])
  const buyGrape    = useCallback((id)  => setGs(s => doBuyGrape(s, id)), [])
  const selectGrape = useCallback((id)  => setGs(s => ({...s, selectedGrape: id})), [])
  const startBlend  = useCallback(() => setGs(s => doStartBlend(s)), [])
  const setBlendA   = useCallback((v)  => setGs(s => ({...s, blendA: v})), [])
  const setBlendB   = useCallback((v)  => setGs(s => ({...s, blendB: v})), [])
  const claimEvent  = useCallback(() => setGs(s => doClaimEvent(s)), [])
  const claimDaily  = useCallback(() => setGs(s => doClaimDaily(s)), [])
  const watchAd     = useCallback(() => setGs(s => doWatchAd(s)), [])
  const dismissVisitor = useCallback(() => setGs(s => ({...s, visitor: null})), [])
  const acceptVisitor  = useCallback(() => setGs(s => doAcceptVisitor(s)), [])
  const doPrestige     = useCallback(() => setGs(s => doPrestigeReset(s)), [])
  const setTab         = useCallback((t) => { SFX.tab(); setGs(s => ({...s, tab: t})) }, [])
  const dismissOffline = useCallback(() => setGs(s => ({...s, offlineEarnings: null})), [])
  const resetGame      = useCallback(() => { localStorage.removeItem(SAVE_KEY); setGs(initialState()) }, [])

  return {
    gs,
    harvest, press, cellar, sell, startExport, buyUpgrade, hireStaff,
    buyGrape, selectGrape, startBlend, setBlendA, setBlendB,
    claimEvent, claimDaily, watchAd, dismissVisitor, acceptVisitor,
    doPrestige, setTab, dismissOffline, resetGame,
    // expose data
    GRAPE_VARIETIES, UPGRADE_DEFS, STAFF_DEFS, EXPORT_CITIES,
    SEASONS_DATA, EVENTS_LIST, DAILY_REWARDS, BLEND_NAMES, BLEND_BONUS,
    gUpgVal, gUpgCost, stkCost,
  }
}

// ── Tick logic ────────────────────────────────────────────────────────────────
function tick(s) {
  const dt = 0.25
  let ns = { ...s, tick: s.tick + 1 }

  // Season rotation (3 min = 720 ticks)
  ns.seasonTimer += dt
  if (ns.seasonTimer >= 180) { ns.seasonTimer = 0; ns.season = (ns.season + 1) % 4 }
  const season = SEASONS_DATA[ns.season]

  // Staff automation
  const hLvl = ns.staff.harvester || 0
  const pLvl = ns.staff.presser   || 0
  const cLvl = ns.staff.cellarMgr || 0
  const sLvl = ns.staff.sommelier || 0
  if (hLvl > 0) ns = doHarvest(ns, hLvl * 0.5 * season.hMult)
  if (pLvl > 0) ns = doPress(ns, pLvl * 0.5)
  if (cLvl > 0) ns = doCellar(ns, cLvl * 0.5)
  if (sLvl > 0) { const bonus = sLvl * 0.25; ns.winePrice = (gUpgVal(ns.upgrades, 'winePrice') + bonus) * season.wBonus }

  // Export timer
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

  // Active event progress
  if (ns.activeEvent) {
    ns.eventTimer -= dt
    if (ns.eventTimer <= 0) { ns.activeEvent = null }
  } else if (ns.tick % 480 === 0) {
    ns.activeEvent = EVENTS_LIST[Math.floor(Math.random() * EVENTS_LIST.length)]
    ns.eventTimer = ns.activeEvent.secs
    ns.eventProgress = 0
  }

  // Visitor spawn
  ns.visitorTimer -= dt
  if (ns.visitorTimer <= 0 && !ns.visitor) {
    ns.visitor = VISITOR_POOL[Math.floor(Math.random() * VISITOR_POOL.length)]
    ns.visitorTimer = 120 + Math.random() * 180
  }

  // Ad cooldown
  if (ns.adActive) { ns.adTimer -= dt; if (ns.adTimer <= 0) ns.adActive = false }

  // Blend timer
  if (ns.blendActive) {
    ns.blendTimer -= dt
    if (ns.blendTimer <= 0) { ns.blendActive = false; ns.wine += ns.blendWine; ns.blendWine = 0 }
  }

  return ns
}

// ── Action helpers ────────────────────────────────────────────────────────────
function doHarvest(s, amount) {
  const rate = amount ?? gUpgVal(s.upgrades, 'vineYield') * (SEASONS_DATA[s.season].hMult || 1)
  SFX.harvest()
  return { ...s, grapes: s.grapes + rate }
}
function doPress(s, amount) {
  const rate = amount ?? gUpgVal(s.upgrades, 'pressSpeed')
  const pressed = Math.min(s.grapes, rate)
  if (pressed <= 0) return s
  SFX.press()
  return { ...s, grapes: s.grapes - pressed, juice: s.juice + pressed }
}
function doCellar(s, amount) {
  const rate = amount ?? gUpgVal(s.upgrades, 'cellarSpeed')
  const bottled = Math.min(s.juice, rate)
  if (bottled <= 0) return s
  SFX.bottle()
  return { ...s, juice: s.juice - bottled, wine: s.wine + bottled }
}
function doSell(s) {
  if (s.wine <= 0) return s
  const earned = Math.floor(s.wine * s.winePrice * (SEASONS_DATA[s.season].wBonus || 1))
  SFX.sell()
  return { ...s, money: s.money + earned, wine: 0, fame: s.fame + Math.floor(earned / 150), reputation: Math.min(5, s.reputation + 0.05) }
}
function doStartExport(s, cityId) {
  const city = EXPORT_CITIES.find(c => c.id === cityId)
  if (!city || s.wine < city.minWine || s.reputation < city.repReq) return s
  return { ...s, exportCity: cityId, exportTimer: city.secs, exportActive: true }
}
function doBuyUpgrade(s, key) {
  const cost = gUpgCost(s.upgrades, key)
  if (s.money < cost) return s
  SFX.upgrade()
  const upgrades = { ...s.upgrades, [key]: (s.upgrades[key] || 0) + 1 }
  return { ...s, money: s.money - cost, upgrades }
}
function doHireStaff(s, key) {
  const lvl = s.staff[key] || 0
  const cost = stkCost(key, lvl)
  if (s.money < cost) return s
  SFX.upgrade()
  return { ...s, money: s.money - cost, staff: { ...s.staff, [key]: lvl + 1 } }
}
function doBuyGrape(s, id) {
  const g = GRAPE_VARIETIES.find(v => v.id === id)
  if (!g || s.money < g.cost || s.ownedGrapes.includes(id)) return s
  return { ...s, money: s.money - g.cost, ownedGrapes: [...s.ownedGrapes, id], selectedGrape: id }
}
function doStartBlend(s) {
  if (!s.blendA || !s.blendB || s.wine < 10) return s
  const key = [s.blendA, s.blendB].sort().join('_')
  const bonus = BLEND_BONUS[key] || 1.1
  const blendWine = Math.floor(s.wine * bonus)
  return { ...s, wine: 0, blendActive: true, blendTimer: 30, blendWine, money: s.money }
}
function doClaimEvent(s) {
  if (!s.activeEvent || s.eventProgress < s.activeEvent.target) return s
  return { ...s, money: s.money + s.activeEvent.reward.money, fame: s.fame + s.activeEvent.reward.fame, activeEvent: null }
}
function doClaimDaily(s) {
  const today = new Date().toDateString()
  if (s.lastDaily === today) return s
  const streak = (s.lastDaily === new Date(Date.now() - 86400000).toDateString()) ? Math.min(s.dailyStreak + 1, 6) : 0
  const reward = DAILY_REWARDS[streak]
  return { ...s, money: s.money + reward.money, lastDaily: today, dailyStreak: streak }
}
function doWatchAd(s) {
  return { ...s, money: s.money * 2, adActive: true, adTimer: AD_DURATION }
}
function doAcceptVisitor(s) {
  if (!s.visitor) return s
  const v = s.visitor
  return { ...s, visitor: null, money: s.money + (v.reward?.money || 0), fame: s.fame + (v.reward?.fame || 0) }
}
function doPrestigeReset(s) {
  if (s.fame < 1000) return s
  SFX.prestige()
  return {
    ...initialState(),
    prestige: s.prestige + 1,
    prestigeUnlocks: [...s.prestigeUnlocks, `prestige_${s.prestige + 1}`],
    money: 200 + s.prestige * 50,
  }
}

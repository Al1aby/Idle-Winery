// ─────────────────────────────────────────────────────────────────────────────
//  GAME CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const VINE_COOLDOWN    = 15   // seconds per harvest
export const GRAPES_PER_BARREL = 15  // grapes needed to press 1 barrel
export const FERMENT_SECS     = 30   // seconds to ferment a batch
export const PRESS_SECS       = 10   // seconds to press a batch
export const VINE_ROW_COSTS   = [1000, 3500, 9000, 22000, 60000]  // cost of each extra row
export const AD_WORKER_DURATION = 300  // 5 minutes of ad-powered automation

export const GRAPE_VARIETIES = [
  { id:"chardonnay", name:"Chardonnay", emoji:"🍇", unlockCost:0,     grapeValue:1,  wineMultiplier:1,   prem:false, prestigeReq:0 },
  { id:"merlot",     name:"Merlot",     emoji:"🍷", unlockCost:1500,  grapeValue:2.5,wineMultiplier:2,   prem:false, prestigeReq:0 },
  { id:"riesling",   name:"Riesling",   emoji:"🌿", unlockCost:7000,  grapeValue:5,  wineMultiplier:3.5, prem:false, prestigeReq:1 },
  { id:"cabernet",   name:"Cabernet",   emoji:"🫐", unlockCost:28000, grapeValue:10, wineMultiplier:6,   prem:false, prestigeReq:2 },
  { id:"champagne",  name:"Champagne",  emoji:"🥂", unlockCost:0,    grapeValue:18, wineMultiplier:12,  prem:true  },
  { id:"icewine",    name:"Ice Wine",   emoji:"❄️",  unlockCost:0,    grapeValue:25, wineMultiplier:18,  prem:true  },
  { id:"barolo",     name:"Barolo",     emoji:"🏆", unlockCost:0,    grapeValue:35, wineMultiplier:24,  prem:true  },
]

export const UPGRADE_DEFS = {
  vineYield:  { label:"Vine Yield",     icon:"🍇", desc:"More grapes per harvest",      baseCost:50,  costMult:1.4, baseVal:1, valPerLevel:1   },
  pressSpeed: { label:"Press Efficiency",icon:"🛢️", desc:"Fewer grapes needed per barrel",baseCost:80,  costMult:1.5, baseVal:0, valPerLevel:2   },
  cellarSpeed:{ label:"Ferment Speed",  icon:"🪣", desc:"Faster barrel fermentation",   baseCost:120, costMult:1.6, baseVal:0, valPerLevel:5   },
  winePrice:  { label:"Wine Quality",   icon:"💎", desc:"Higher per-bottle sale price", baseCost:200, costMult:1.7, baseVal:1, valPerLevel:0.4 },
}

export const STAFF_DEFS = {
  harvester:{ name:"Vineyard Worker", desc:"Automates 2 / 4 / 8 vine rows",          emoji:"👨‍🌾", baseCost:500,  costMult:3,   maxLvl:3, vines:[2,4,8]          },
  presser:  { name:"Press Operator",  desc:"Auto-presses 1 / 2 / 5 batches/cycle",   emoji:"⚙️",  baseCost:800,  costMult:3,   maxLvl:3, batches:[1,2,5]        },
  cellarMgr:{ name:"Cellar Manager",  desc:"Auto-ferments 1 / 2 / 3 barrels/cycle",  emoji:"🪣", baseCost:1200, costMult:3,   maxLvl:3, mults:[1,2,3]          },
  sommelier:{ name:"Sommelier",       desc:"Boosts wine sale price",                  emoji:"🥂", baseCost:2000, costMult:3.5, maxLvl:3, mults:[1.2,1.45,1.75]  },
}

export const EXPORT_CITIES = [
  { id:"local",   name:"Local Town", mult:1.5, baseSecs:60,  minWine:3,  repReq:0 },
  { id:"paris",   name:"Paris",      mult:2.5, baseSecs:150, minWine:8,  repReq:1 },
  { id:"london",  name:"London",     mult:3.5, baseSecs:300, minWine:12, repReq:2 },
  { id:"newyork", name:"New York",   mult:5.5, baseSecs:540, minWine:20, repReq:3 },
  { id:"tokyo",   name:"Tokyo",      mult:8,   baseSecs:900, minWine:30, repReq:4 },
]

export const EVENTS_LIST = [
  { id:"e1", name:"Harvest Festival", desc:"Harvest 200 grapes",  type:"harvest", target:200, secs:360, reward:{money:60,  fame:4  } },
  { id:"e2", name:"Red Wine Gala",    desc:"Sell 20 bottles",     type:"sell",    target:20,  secs:480, reward:{money:120, fame:6  } },
  { id:"e3", name:"Press Blitz",      desc:"Press 10 barrels",    type:"press",   target:10,  secs:480, reward:{money:75,  fame:4  } },
  { id:"e4", name:"Export Rush",      desc:"Complete 2 exports",  type:"export",  target:2,   secs:900, reward:{money:250, fame:12 } },
]

export const DAILY_REWARDS = [
  { day:1, desc:"$50",             money:50,   grapes:0,   wine:0,  fame:0  },
  { day:2, desc:"200 Grapes",      money:0,    grapes:200, wine:0,  fame:0  },
  { day:3, desc:"$300",            money:300,  grapes:0,   wine:0,  fame:0  },
  { day:4, desc:"10 Wine",         money:0,    grapes:0,   wine:10, fame:0  },
  { day:5, desc:"$600 + 5 Fame",   money:600,  grapes:0,   wine:0,  fame:5  },
  { day:6, desc:"$1000 + 20 Fame", money:1000, grapes:500, wine:10, fame:20 },
]

export const VISITOR_POOL = [
  { id:"critic",   name:"Wine Critic",    desc:"Taste 5 bottles for +1 reputation!", type:"rep",    costWine:5               },
  { id:"buyer",    name:"Bulk Buyer",     desc:"Buy all wine at 2x price!",           type:"sale3x", costWine:0, saleMult:2  },
  { id:"tourist",  name:"Wine Tourist",   desc:"Give 3 bottles for a $60 tour fee.",  type:"cash",   costWine:3, cash:60     },
  { id:"investor", name:"Angel Investor", desc:"Gift 4 bottles for $150 + 2 Fame.",   type:"invest", costWine:4, cash:150, fame:2 },
]

export const IAP_LIST = [
  { id:"starter",    name:"Starter Pack",  price:"$0.99",    desc:"$200 + 100 Grapes",          money:200,  grapes:100,  once:true },
  { id:"vineyard",   name:"Vineyard Pack", price:"$2.99",    desc:"$1000 + 500 Grapes + Merlot", money:1000, grapes:500,  unlockV:"merlot", once:true },
  { id:"winery",     name:"Winery Bundle", price:"$9.99",    desc:"$5000 + All varieties",       money:5000, grapes:2000, unlockAll:true, once:true },
  { id:"adfree",     name:"Ad-Free",       price:"$3.99",    desc:"Permanent auto-workers",      flag:"adFree" },
  { id:"seasonpass", name:"Season Pass",   price:"$2.99/mo", desc:"Premium grapes + bonuses",    flag:"seasonPass" },
]

export const BLEND_NAMES = ["Estate Cuvée","Grand Reserve","Maison Blend","Prestige Select","Château Special"]
export const BLEND_BONUS = {
  "champagne+barolo":3.0, "barolo+champagne":3.0,
  "merlot+cabernet":2.1,  "cabernet+merlot":2.1,
  "chardonnay+riesling":1.85, "riesling+chardonnay":1.85,
  "champagne+riesling":2.4,
}

export const AD_DURATION = 600

// ─── Helper functions ────────────────────────────────────────────────────────
export const fmt = n =>
  n >= 1e6 ? (n/1e6).toFixed(1)+"M" :
  n >= 1000 ? (n/1000).toFixed(1)+"K" :
  Math.floor(n).toString()

export const mmss = s =>
  `${String(Math.floor(s/60)).padStart(2,"0")}:${String(Math.floor(s%60)).padStart(2,"0")}`

export function gUpgVal(upgrades, key) {
  const level = upgrades[key] || 0
  const def = UPGRADE_DEFS[key]
  return def.baseVal + level * def.valPerLevel
}

export function gUpgCost(upgrades, key) {
  const level = upgrades[key] || 0
  const def = UPGRADE_DEFS[key]
  return Math.floor(def.baseCost * Math.pow(def.costMult, level))
}

export function stkCost(key, level) {
  return Math.floor(STAFF_DEFS[key].baseCost * Math.pow(STAFF_DEFS[key].costMult, level))
}

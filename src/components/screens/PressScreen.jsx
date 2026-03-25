import { useGameStore } from '@/hooks/useGameState';
import {
  fmt, mmss, UPGRADE_DEFS, STAFF_DEFS, GRAPES_PER_BARREL, PRESS_SECS,
  GRAPE_VARIETIES, gUpgCost, gUpgVal, stkCost,
} from '@/constants/game';
import { PressHouseBG } from '@/scenes';

export default function PressScreen() {
  const {
    money, upgrades, staff,
    inventory, activeVariety, unlockedVarieties,
    pressQueue, pressSecs, pressVariety, adWorkers,
    pressGrapes, buyUpgrade, buyStaff, watchAdWorker,
  } = useGameStore(s => ({
    money:             s.money,
    upgrades:          s.upgrades,
    staff:             s.staff,
    inventory:         s.inventory,
    activeVariety:     s.activeVariety,
    unlockedVarieties: s.unlockedVarieties,
    pressQueue:        s.pressQueue,
    pressSecs:         s.pressSecs,
    pressVariety:      s.pressVariety,
    adWorkers:         s.adWorkers,
    pressGrapes:       s.pressGrapes,
    buyUpgrade:        s.buyUpgrade,
    buyStaff:          s.buyStaff,
    watchAdWorker:     s.watchAdWorker,
  }));

  const inv          = inventory[activeVariety] || { grapes: 0, barrels: 0, wine: 0 };
  const grapeCost    = Math.max(5, GRAPES_PER_BARREL - gUpgVal(upgrades, 'pressSpeed'));
  const maxBatches   = Math.floor(inv.grapes / grapeCost);
  const pressTime    = Math.max(3, PRESS_SECS - gUpgVal(upgrades, 'pressSpeed') * 0.5);
  const pressing     = pressQueue > 0;
  const pressPct     = pressing ? (1 - pressSecs / pressTime) * 100 : 0;
  const pressAdTimer = adWorkers?.presser || 0;
  const pvVariety    = pressVariety ? GRAPE_VARIETIES.find(g => g.id === pressVariety) : null;

  return (
    <div className="screen">
      <PressHouseBG />
      <div className="screen-content">
        <h2 className="screen-title">⚙️ Press House</h2>

        {/* Resource bar — active variety */}
        <div className="pipeline">
          <div className="pipeline-step">
            <div className="pipe-label">🍇 Grapes</div>
            <div className="pipe-value">{Math.floor(inv.grapes)}</div>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step">
            <div className="pipe-label">Cost</div>
            <div className="pipe-value">{grapeCost}/barrel</div>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step">
            <div className="pipe-label">🛢️ Barrels</div>
            <div className="pipe-value">{Math.floor(inv.barrels)}</div>
          </div>
        </div>

        {/* Press cooldown or press buttons */}
        {pressing ? (
          <div className="cellar-fermenting">
            <div className="ferm-header">
              <span className="ferm-label">
                🔄 Pressing {pressQueue} barrel{pressQueue > 1 ? 's' : ''}
                {pvVariety ? ` (${pvVariety.emoji} ${pvVariety.name})` : ''}…
              </span>
              <span className="ferm-timer">{mmss(pressSecs)}</span>
            </div>
            <div className="ferm-progress-bar">
              <div className="ferm-progress-fill press-fill" style={{ width: `${pressPct}%` }} />
            </div>
          </div>
        ) : (
          <>
            <div className="press-btn-row">
              {[1, 5, 10].map(n => (
                <button
                  key={n}
                  className={`action-btn press-qty-btn ${maxBatches < n ? 'disabled' : ''}`}
                  onClick={() => pressGrapes(n)}
                  disabled={maxBatches < n}
                >
                  Press {n}
                  <span className="btn-cost">({n * grapeCost} 🍇)</span>
                </button>
              ))}
              <button
                className={`action-btn press-qty-btn ${maxBatches < 1 ? 'disabled' : ''}`}
                onClick={() => pressGrapes(maxBatches)}
                disabled={maxBatches < 1}
              >
                Press All
                <span className="btn-cost">({Math.floor(inv.grapes)} 🍇)</span>
              </button>
            </div>

            {maxBatches < 1 && (
              <p className="press-hint">Need {grapeCost} grapes to press 1 barrel — go harvest!</p>
            )}
          </>
        )}

        {/* Auto-press ad worker */}
        <div className="ad-worker-row">
          {pressAdTimer > 0 ? (
            <div className="ad-worker-active">
              ⚙️ Auto-press active — {mmss(pressAdTimer)} left
            </div>
          ) : (
            <button className="watch-ad-btn" onClick={() => watchAdWorker('presser')}>
              📺 Watch Ad → Auto-press 5 min
            </button>
          )}
        </div>

        {/* Per-variety barrel inventory */}
        {unlockedVarieties.length > 1 && (
          <>
            <h3 className="section-title">Barrel Inventory</h3>
            <div className="inv-breakdown">
              {unlockedVarieties.map(vid => {
                const v       = GRAPE_VARIETIES.find(g => g.id === vid);
                const barrels = Math.floor((inventory[vid] || {}).barrels || 0);
                return (
                  <div key={vid} className={`inv-row ${vid === activeVariety ? 'active' : ''}`}>
                    <span className="inv-emoji">{v?.emoji}</span>
                    <span className="inv-name">{v?.name}</span>
                    <span className="inv-count">{fmt(barrels)} 🛢️</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Upgrades */}
        <h3 className="section-title">Upgrades</h3>
        <div className="upgrade-grid">
          {Object.entries(UPGRADE_DEFS).map(([key, def]) => {
            const level = upgrades[key] || 0;
            const cost  = gUpgCost(upgrades, key);
            const val   = gUpgVal(upgrades, key);
            const can   = money >= cost;
            return (
              <div key={key} className="upgrade-card">
                <div className="upg-icon">{def.icon}</div>
                <div className="upg-info">
                  <div className="upg-label">{def.label} <span className="upg-level">Lv{level}</span></div>
                  <div className="upg-desc">{def.desc}</div>
                  <div className="upg-val">Value: {val.toFixed(1)}</div>
                </div>
                <button
                  className={`upg-btn ${can ? '' : 'disabled'}`}
                  onClick={() => buyUpgrade(key)}
                  disabled={!can}
                >
                  ${fmt(cost)}
                </button>
              </div>
            );
          })}
        </div>

        {/* Staff */}
        <h3 className="section-title">Staff</h3>
        <div className="staff-grid">
          {Object.entries(STAFF_DEFS).map(([key, def]) => {
            const level = staff[key] || 0;
            const maxed = level >= def.maxLvl;
            const cost  = maxed ? null : stkCost(key, level);
            const can   = !maxed && money >= cost;
            return (
              <div key={key} className="staff-card">
                <div className="staff-emoji">{def.emoji}</div>
                <div className="staff-info">
                  <div className="staff-name">{def.name}</div>
                  <div className="staff-desc">{def.desc}</div>
                  <div className="staff-level">Level {level}/{def.maxLvl}</div>
                </div>
                <button
                  className={`staff-btn ${maxed ? 'maxed' : can ? '' : 'disabled'}`}
                  onClick={() => buyStaff(key)}
                  disabled={maxed || !can}
                >
                  {maxed ? 'MAX' : `$${fmt(cost)}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

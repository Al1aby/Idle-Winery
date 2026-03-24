import { useGameStore } from '@/hooks/useGameState';
import { fmt, UPGRADE_DEFS, STAFF_DEFS, GRAPES_PER_BARREL, gUpgCost, gUpgVal, stkCost } from '@/constants/game';
import { PressHouseBG } from '@/scenes';

export default function PressScreen() {
  const {
    money, grapes, barrels,
    upgrades, staff,
    pressGrapes, buyUpgrade, buyStaff,
  } = useGameStore(s => ({
    money:       s.money,
    grapes:      s.grapes,
    barrels:     s.barrels,
    upgrades:    s.upgrades,
    staff:       s.staff,
    pressGrapes: s.pressGrapes,
    buyUpgrade:  s.buyUpgrade,
    buyStaff:    s.buyStaff,
  }));

  const grapeCost = Math.max(5, GRAPES_PER_BARREL - gUpgVal(upgrades, 'pressSpeed'));
  const maxBatches = Math.floor(grapes / grapeCost);

  return (
    <div className="screen">
      <PressHouseBG />
      <div className="screen-content">
        <h2 className="screen-title">⚙️ Press House</h2>

        {/* Resource bar */}
        <div className="pipeline">
          <div className="pipeline-step">
            <div className="pipe-label">🍇 Grapes</div>
            <div className="pipe-value">{Math.floor(grapes)}</div>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step">
            <div className="pipe-label">Cost</div>
            <div className="pipe-value">{grapeCost}/barrel</div>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step">
            <div className="pipe-label">🛢️ Barrels</div>
            <div className="pipe-value">{Math.floor(barrels)}</div>
          </div>
        </div>

        {/* Press buttons */}
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
            <span className="btn-cost">({Math.floor(grapes)} 🍇)</span>
          </button>
        </div>

        {maxBatches < 1 && (
          <p className="press-hint">Need {grapeCost} grapes to press 1 barrel — go harvest!</p>
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

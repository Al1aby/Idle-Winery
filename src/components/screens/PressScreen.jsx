import { useGameStore } from '@/hooks/useGameState';
import { fmt, mmss, UPGRADE_DEFS, STAFF_DEFS, gUpgCost, gUpgVal, stkCost } from '@/constants/game';
import { PressHouseBG } from '@/scenes';

export default function PressScreen() {
  const {
    money, grapes, grapeQueue, pressQueue, pressSecs,
    cellarQueue, cellarSecs, wine,
    upgrades, staff,
    startPress, buyUpgrade, buyStaff,
  } = useGameStore(s => ({
    money:        s.money,
    grapes:       s.grapes,
    grapeQueue:   s.grapeQueue,
    pressQueue:   s.pressQueue,
    pressSecs:    s.pressSecs,
    cellarQueue:  s.cellarQueue,
    cellarSecs:   s.cellarSecs,
    wine:         s.wine,
    upgrades:     s.upgrades,
    staff:        s.staff,
    startPress:   s.startPress,
    buyUpgrade:   s.buyUpgrade,
    buyStaff:     s.buyStaff,
  }));

  return (
    <div className="screen">
      <PressHouseBG />
      <div className="screen-content">
        <h2 className="screen-title">⚙️ Press House</h2>

        {/* Pipeline status */}
        <div className="pipeline">
          <div className="pipeline-step">
            <div className="pipe-label">🍇 Queue</div>
            <div className="pipe-value">{Math.floor(grapeQueue)}</div>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step">
            <div className="pipe-label">⚙️ Press</div>
            <div className="pipe-value">{pressQueue > 0 ? mmss(pressSecs) : '—'}</div>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step">
            <div className="pipe-label">🪣 Cellar</div>
            <div className="pipe-value">{cellarQueue > 0 ? mmss(cellarSecs) : '—'}</div>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step">
            <div className="pipe-label">🍷 Wine</div>
            <div className="pipe-value">{Math.floor(wine)}</div>
          </div>
        </div>

        {/* Press button */}
        <button
          className={`action-btn ${grapeQueue < 10 ? 'disabled' : ''}`}
          onClick={startPress}
          disabled={grapeQueue < 10 || pressQueue > 0}
        >
          Press {Math.floor(grapeQueue)} grapes
          {grapeQueue < 10 && <span className="btn-hint"> (need 10)</span>}
        </button>

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
                  <div className="upg-val">Current: {val.toFixed(1)}</div>
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
            const level   = staff[key] || 0;
            const maxed   = level >= def.maxLvl;
            const cost    = maxed ? null : stkCost(key, level);
            const can     = !maxed && money >= cost;
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

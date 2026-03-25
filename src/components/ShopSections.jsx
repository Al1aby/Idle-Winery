import { UPGRADE_DEFS, STAFF_DEFS, fmt, gUpgCost, gUpgVal, stkCost } from '@/constants/game';

export function UpgradeSection({ keys, upgrades, money, buyUpgrade }) {
  return (
    <>
      <h3 className="section-title">Upgrades</h3>
      <div className="upgrade-grid">
        {keys.map(key => {
          const def   = UPGRADE_DEFS[key];
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
              <button className={`upg-btn ${can ? '' : 'disabled'}`} onClick={() => buyUpgrade(key)} disabled={!can}>
                ${fmt(cost)}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function StaffSection({ keys, staff, money, prestigeLvl, buyStaff }) {
  return (
    <>
      <h3 className="section-title">Staff</h3>
      <div className="staff-grid">
        {keys.map(key => {
          const def         = STAFF_DEFS[key];
          const level       = staff[key] || 0;
          const maxed       = level >= def.maxLvl;
          const prestigeLock = !maxed && (level + 1) >= 3 && (prestigeLvl || 0) < 1;
          const cost        = (!maxed && !prestigeLock) ? stkCost(key, level) : null;
          const can         = !maxed && !prestigeLock && money >= cost;
          return (
            <div key={key} className="staff-card">
              <div className="staff-emoji">{def.emoji}</div>
              <div className="staff-info">
                <div className="staff-name">{def.name}</div>
                <div className="staff-desc">{def.desc}</div>
                <div className="staff-level">Level {level}/{def.maxLvl}</div>
              </div>
              <button
                className={`staff-btn ${maxed ? 'maxed' : (prestigeLock || !can) ? 'disabled' : ''}`}
                onClick={() => buyStaff(key)}
                disabled={maxed || prestigeLock || !can}
              >
                {maxed ? 'MAX' : prestigeLock ? '✨ Prestige 1' : `$${fmt(cost)}`}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

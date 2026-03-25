import { useGameStore } from '@/hooks/useGameState';
import { GRAPE_VARIETIES, VINE_COOLDOWN, VINE_ROW_COSTS, fmt, gUpgVal, mmss } from '@/constants/game';
import { VineyardBG } from '@/scenes';
import { UpgradeSection, StaffSection } from '@/components/ShopSections';

export default function VineyardScreen() {
  const {
    money, vines, unlockedVarieties, activeVariety, upgrades, staff, prestigeLvl,
    inventory, adWorkers,
    harvestVine, buyVineRow, unlockVariety, watchAdWorker, buyUpgrade, buyStaff,
  } = useGameStore(s => ({
    money:             s.money,
    vines:             s.vines,
    unlockedVarieties: s.unlockedVarieties,
    activeVariety:     s.activeVariety,
    upgrades:          s.upgrades,
    staff:             s.staff,
    prestigeLvl:       s.prestigeLvl,
    inventory:         s.inventory,
    adWorkers:         s.adWorkers,
    harvestVine:       s.harvestVine,
    buyVineRow:        s.buyVineRow,
    unlockVariety:     s.unlockVariety,
    watchAdWorker:     s.watchAdWorker,
    buyUpgrade:        s.buyUpgrade,
    buyStaff:          s.buyStaff,
  }));

  const variety = GRAPE_VARIETIES.find(v => v.id === activeVariety) || GRAPE_VARIETIES[0];
  const yieldPerHarvest = Math.round(gUpgVal(upgrades, 'vineYield') * variety.grapeValue * 10) / 10;

  const extraRows = vines.length - 4;
  const nextRowCost = extraRows < VINE_ROW_COSTS.length ? VINE_ROW_COSTS[extraRows] : null;
  const harvAdTimer = adWorkers?.harvester || 0;

  return (
    <div className="screen">
      <VineyardBG />
      <div className="screen-content">
        <h2 className="screen-title">🍇 Vineyard</h2>

        {/* Vine rows */}
        <div className="vine-rows">
          {vines.map((vine, idx) => {
            const ready    = vine.cooldown <= 0;
            const progress = ready ? 1 : (VINE_COOLDOWN - vine.cooldown) / VINE_COOLDOWN;
            return (
              <div key={vine.id} className="vine-row-card">
                <div className="vine-row-header">
                  <span className="vine-row-title">{variety.emoji} Row {idx + 1}</span>
                  {!ready && <span className="vine-row-timer">{vine.cooldown.toFixed(1)}s</span>}
                </div>
                <div className="vine-progress-bar">
                  <div
                    className={`vine-progress-fill ${ready ? 'ready' : ''}`}
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <button
                  className={`vine-harvest-btn ${ready ? 'ready' : 'cooling'}`}
                  onClick={() => harvestVine(vine.id)}
                  disabled={!ready}
                >
                  {ready ? `🌾 Harvest (+${yieldPerHarvest} 🍇)` : `⏳ Growing…`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Buy new row */}
        {nextRowCost !== null ? (
          <button
            className={`buy-row-btn ${money >= nextRowCost ? '' : 'disabled'}`}
            onClick={buyVineRow}
            disabled={money < nextRowCost}
          >
            ➕ Buy Row {vines.length + 1} — ${fmt(nextRowCost)}
          </button>
        ) : (
          <div className="buy-row-maxed">✅ All rows unlocked ({vines.length} rows)</div>
        )}

        {/* Auto-harvest ad worker */}
        <div className="ad-worker-row">
          {harvAdTimer > 0 ? (
            <div className="ad-worker-active">
              👨‍🌾 Auto-harvest active — {mmss(harvAdTimer)} left
            </div>
          ) : (
            <button className="watch-ad-btn" onClick={() => watchAdWorker('harvester')}>
              📺 Watch Ad → Auto-harvest 5 min
            </button>
          )}
        </div>

        {/* Per-variety grape inventory */}
        {unlockedVarieties.length > 1 && (
          <>
            <h3 className="section-title">Grape Inventory</h3>
            <div className="inv-breakdown">
              {unlockedVarieties.map(vid => {
                const v = GRAPE_VARIETIES.find(g => g.id === vid);
                const grapes = Math.floor((inventory[vid] || {}).grapes || 0);
                return (
                  <div key={vid} className={`inv-row ${vid === activeVariety ? 'active' : ''}`}>
                    <span className="inv-emoji">{v?.emoji}</span>
                    <span className="inv-name">{v?.name}</span>
                    <span className="inv-count">{fmt(grapes)} 🍇</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Variety selector */}
        <h3 className="section-title">Grape Variety</h3>
        <div className="variety-grid">
          {GRAPE_VARIETIES.filter(v => !v.prem).map(v => {
            const owned        = unlockedVarieties.includes(v.id);
            const active       = activeVariety === v.id;
            const prestigeLock = (v.prestigeReq || 0) > (prestigeLvl || 0);
            const canBuy       = !owned && !prestigeLock && money >= v.unlockCost;
            return (
              <div
                key={v.id}
                className={`variety-card ${active ? 'active' : ''} ${!owned ? 'locked' : ''}`}
                onClick={() => {
                  if (owned) useGameStore.setState({ activeVariety: v.id });
                  else if (canBuy) unlockVariety(v.id);
                }}
              >
                <div className="variety-emoji">{v.emoji}</div>
                <div className="variety-name">{v.name}</div>
                <div className="variety-stats">
                  <span title="Cases per barrel">📦 ×{v.wineMultiplier}</span>
                  <span title="Grape yield multiplier">🍇 ×{v.grapeValue}</span>
                </div>
                <div className="variety-price-hint">${v.wineMultiplier}/case base</div>
                {!owned && prestigeLock && (
                  <div className="variety-cost expensive">✨ Prestige {v.prestigeReq}</div>
                )}
                {!owned && !prestigeLock && (
                  <div className={`variety-cost ${canBuy ? 'affordable' : 'expensive'}`}>
                    ${fmt(v.unlockCost)}
                  </div>
                )}
                {active && <div className="variety-active-badge">Active</div>}
              </div>
            );
          })}
        </div>

        <div className="season-pass-note">
          🔒 Premium varieties (Champagne, Ice Wine, Barolo) unlock with Season Pass
        </div>

        <UpgradeSection keys={['vineYield']} upgrades={upgrades} money={money} buyUpgrade={buyUpgrade} />
        <StaffSection keys={['harvester']} staff={staff} money={money} prestigeLvl={prestigeLvl} buyStaff={buyStaff} />
      </div>
    </div>
  );
}

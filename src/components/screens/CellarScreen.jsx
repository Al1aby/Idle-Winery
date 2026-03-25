import { useGameStore } from '@/hooks/useGameState';
import { fmt, mmss, FERMENT_SECS, GRAPE_VARIETIES, gUpgVal } from '@/constants/game';
import { CellarBG } from '@/scenes';

export default function CellarScreen() {
  const {
    upgrades, inventory, activeVariety, unlockedVarieties,
    fermentQueue, fermentSecs, fermentVariety, adWorkers,
    fermentBarrels, sellWine, watchAdWorker,
  } = useGameStore(s => ({
    upgrades:          s.upgrades,
    inventory:         s.inventory,
    activeVariety:     s.activeVariety,
    unlockedVarieties: s.unlockedVarieties,
    fermentQueue:      s.fermentQueue,
    fermentSecs:       s.fermentSecs,
    fermentVariety:    s.fermentVariety,
    adWorkers:         s.adWorkers,
    fermentBarrels:    s.fermentBarrels,
    sellWine:          s.sellWine,
    watchAdWorker:     s.watchAdWorker,
  }));

  const inv           = inventory[activeVariety] || { grapes: 0, barrels: 0, wine: 0 };
  const fermentTime   = Math.max(5, FERMENT_SECS - gUpgVal(upgrades, 'cellarSpeed'));
  const fermenting    = fermentQueue > 0;
  const fermentPct    = fermenting ? (1 - fermentSecs / fermentTime) * 100 : 0;
  const cellarAdTimer = adWorkers?.cellarMgr || 0;
  const fvVariety     = fermentVariety ? GRAPE_VARIETIES.find(g => g.id === fermentVariety) : null;

  return (
    <div className="screen">
      <CellarBG />
      <div className="screen-content">
        <h2 className="screen-title">🪣 Wine Cellar</h2>

        {/* Barrel / wine stock — active variety */}
        <div className="cellar-resource-row">
          <div className="cellar-res-card">
            <div className="cellar-res-emoji">🛢️</div>
            <div className="cellar-res-count">{Math.floor(inv.barrels)}</div>
            <div className="cellar-res-label">Barrels</div>
          </div>
          <div className="cellar-arrow">→</div>
          <div className="cellar-res-card">
            <div className="cellar-res-emoji">🍷</div>
            <div className="cellar-res-count">{Math.floor(inv.wine)}</div>
            <div className="cellar-res-label">Bottles</div>
          </div>
        </div>

        {/* Fermentation */}
        {fermenting ? (
          <div className="cellar-fermenting">
            <div className="ferm-header">
              <span className="ferm-label">
                🫧 Fermenting {fermentQueue} barrel{fermentQueue > 1 ? 's' : ''}
                {fvVariety ? ` (${fvVariety.emoji} ${fvVariety.name})` : ''}…
              </span>
              <span className="ferm-timer">{mmss(fermentSecs)}</span>
            </div>
            <div className="ferm-progress-bar">
              <div className="ferm-progress-fill" style={{ width: `${fermentPct}%` }} />
            </div>
          </div>
        ) : (
          <div className="ferm-btn-row">
            {[1, 5, 10].map(n => (
              <button
                key={n}
                className={`action-btn ferm-qty-btn ${inv.barrels < n ? 'disabled' : ''}`}
                onClick={() => fermentBarrels(n)}
                disabled={inv.barrels < n}
              >
                Ferment {n}
              </button>
            ))}
            <button
              className={`action-btn ferm-qty-btn ${inv.barrels < 1 ? 'disabled' : ''}`}
              onClick={() => fermentBarrels(inv.barrels)}
              disabled={inv.barrels < 1}
            >
              Ferment All
            </button>
          </div>
        )}

        {inv.barrels < 1 && !fermenting && (
          <p className="press-hint">No barrels yet — press grapes in the Press House!</p>
        )}

        {/* Auto-ferment ad worker */}
        <div className="ad-worker-row">
          {cellarAdTimer > 0 ? (
            <div className="ad-worker-active">
              🪣 Auto-ferment active — {mmss(cellarAdTimer)} left
            </div>
          ) : (
            <button className="watch-ad-btn" onClick={() => watchAdWorker('cellarMgr')}>
              📺 Watch Ad → Auto-ferment 5 min
            </button>
          )}
        </div>

        {/* Sell wine */}
        <h3 className="section-title">Sell Wine</h3>
        <div className="wine-stock">
          <div className="stock-emoji">🍷</div>
          <div className="stock-count">{Math.floor(inv.wine)}</div>
          <div className="stock-label">bottles ready</div>
        </div>

        <div className="sell-row">
          {[1, 5, 10, 'All'].map(qty => {
            const amount = qty === 'All' ? inv.wine : qty;
            return (
              <button
                key={qty}
                className={`sell-btn ${inv.wine < (qty === 'All' ? 1 : qty) ? 'disabled' : ''}`}
                onClick={() => sellWine(amount)}
                disabled={inv.wine < (qty === 'All' ? 1 : qty)}
              >
                Sell {qty === 'All' ? 'All' : qty}
              </button>
            );
          })}
        </div>

        {/* Per-variety wine inventory */}
        {unlockedVarieties.length > 1 && (
          <>
            <h3 className="section-title">Wine Inventory</h3>
            <div className="inv-breakdown">
              {unlockedVarieties.map(vid => {
                const v    = GRAPE_VARIETIES.find(g => g.id === vid);
                const wine = Math.floor((inventory[vid] || {}).wine || 0);
                return (
                  <div key={vid} className={`inv-row ${vid === activeVariety ? 'active' : ''}`}>
                    <span className="inv-emoji">{v?.emoji}</span>
                    <span className="inv-name">{v?.name}</span>
                    <span className="inv-count">{fmt(wine)} 🍷</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

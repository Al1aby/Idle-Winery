import { useGameStore } from '@/hooks/useGameState';
import { fmt, mmss, FERMENT_SECS, gUpgVal } from '@/constants/game';
import { CellarBG } from '@/scenes';

export default function CellarScreen() {
  const {
    money, barrels, fermentQueue, fermentSecs, wine,
    upgrades,
    fermentBarrels, sellWine,
  } = useGameStore(s => ({
    money:          s.money,
    barrels:        s.barrels,
    fermentQueue:   s.fermentQueue,
    fermentSecs:    s.fermentSecs,
    wine:           s.wine,
    upgrades:       s.upgrades,
    fermentBarrels: s.fermentBarrels,
    sellWine:       s.sellWine,
  }));

  const fermentTime = Math.max(5, FERMENT_SECS - gUpgVal(upgrades, 'cellarSpeed'));
  const fermenting  = fermentQueue > 0;
  const fermentPct  = fermenting ? (1 - fermentSecs / fermentTime) * 100 : 0;

  return (
    <div className="screen">
      <CellarBG />
      <div className="screen-content">
        <h2 className="screen-title">🪣 Wine Cellar</h2>

        {/* Barrel stock */}
        <div className="cellar-resource-row">
          <div className="cellar-res-card">
            <div className="cellar-res-emoji">🛢️</div>
            <div className="cellar-res-count">{Math.floor(barrels)}</div>
            <div className="cellar-res-label">Barrels</div>
          </div>
          <div className="cellar-arrow">→</div>
          <div className="cellar-res-card">
            <div className="cellar-res-emoji">🍷</div>
            <div className="cellar-res-count">{Math.floor(wine)}</div>
            <div className="cellar-res-label">Bottles</div>
          </div>
        </div>

        {/* Fermentation progress */}
        {fermenting ? (
          <div className="cellar-fermenting">
            <div className="ferm-header">
              <span className="ferm-label">🫧 Fermenting {fermentQueue} barrel{fermentQueue > 1 ? 's' : ''}…</span>
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
                className={`action-btn ferm-qty-btn ${barrels < n ? 'disabled' : ''}`}
                onClick={() => fermentBarrels(n)}
                disabled={barrels < n}
              >
                Ferment {n}
              </button>
            ))}
            <button
              className={`action-btn ferm-qty-btn ${barrels < 1 ? 'disabled' : ''}`}
              onClick={() => fermentBarrels(barrels)}
              disabled={barrels < 1}
            >
              Ferment All
            </button>
          </div>
        )}

        {barrels < 1 && !fermenting && (
          <p className="press-hint">No barrels yet — press grapes in the Press House!</p>
        )}

        {/* Sell wine */}
        <h3 className="section-title">Sell Wine</h3>
        <div className="wine-stock">
          <div className="stock-emoji">🍷</div>
          <div className="stock-count">{Math.floor(wine)}</div>
          <div className="stock-label">bottles ready</div>
        </div>

        <div className="sell-row">
          {[1, 5, 10, 'All'].map(qty => {
            const amount = qty === 'All' ? wine : qty;
            return (
              <button
                key={qty}
                className={`sell-btn ${wine < (qty === 'All' ? 1 : qty) ? 'disabled' : ''}`}
                onClick={() => sellWine(amount)}
                disabled={wine < (qty === 'All' ? 1 : qty)}
              >
                Sell {qty === 'All' ? 'All' : qty}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

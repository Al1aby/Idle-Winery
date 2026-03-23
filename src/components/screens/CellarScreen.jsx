import { useGameStore } from '@/hooks/useGameState';
import { fmt, mmss } from '@/constants/game';
import { CellarBG } from '@/scenes';

export default function CellarScreen() {
  const { wine, cellarQueue, cellarSecs, sellWine } = useGameStore(s => ({
    wine:        s.wine,
    cellarQueue: s.cellarQueue,
    cellarSecs:  s.cellarSecs,
    sellWine:    s.sellWine,
  }));

  return (
    <div className="screen">
      <CellarBG />
      <div className="screen-content">
        <h2 className="screen-title">🪣 Wine Cellar</h2>

        {cellarQueue > 0 && (
          <div className="cellar-fermenting">
            <div className="ferm-label">🫧 Fermenting…</div>
            <div className="ferm-timer">{mmss(cellarSecs)}</div>
            <div className="ferm-amount">{cellarQueue} must</div>
          </div>
        )}

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

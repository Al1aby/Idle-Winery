import { useGameStore } from '@/hooks/useGameState';
import { EXPORT_CITIES, fmt, mmss } from '@/constants/game';
import { ExportBG } from '@/scenes';

export default function ExportScreen() {
  const { wine, fame, exportActive, startExport } = useGameStore(s => ({
    wine:        s.wine,
    fame:        s.fame,
    exportActive:s.exportActive,
    startExport: s.startExport,
  }));

  const reputation = Math.min(5, Math.floor(fame / 20)); // 0-5 stars

  return (
    <div className="screen">
      <ExportBG />
      <div className="screen-content">
        <h2 className="screen-title">🚢 Export Market</h2>
        <div className="rep-bar">
          {'⭐'.repeat(reputation)}{'☆'.repeat(5 - reputation)}
          <span className="rep-label"> Reputation {reputation}/5</span>
        </div>

        {exportActive && (
          <div className="export-active">
            <div className="export-shipping">🚢 Shipping to {exportActive.cityId}…</div>
            <div className="export-timer">{mmss(exportActive.secsLeft)}</div>
            <div className="export-reward">+${fmt(exportActive.reward)}</div>
          </div>
        )}

        <div className="city-list">
          {EXPORT_CITIES.map(city => {
            const locked   = reputation < city.repReq;
            const noWine   = wine < city.minWine;
            const busy     = !!exportActive;
            const disabled = locked || noWine || busy;
            return (
              <div key={city.id} className={`city-card ${locked ? 'locked' : ''}`}>
                <div className="city-name">{city.name}</div>
                <div className="city-stats">
                  <span>📦 Need {city.minWine} cs</span>
                  <span>💰 ×{city.mult}</span>
                  <span>⏱ {mmss(city.baseSecs)}</span>
                  {city.repReq > 0 && <span>⭐ Rep {city.repReq}</span>}
                </div>
                <button
                  className={`city-btn ${disabled ? 'disabled' : ''}`}
                  onClick={() => startExport(city.id)}
                  disabled={disabled}
                >
                  {locked ? `🔒 Rep ${city.repReq} needed`
                   : noWine ? `Need ${city.minWine} wine`
                   : busy   ? 'Busy'
                   : 'Ship'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

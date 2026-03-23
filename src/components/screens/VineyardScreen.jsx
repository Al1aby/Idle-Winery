import { useGameStore } from '@/hooks/useGameState';
import { GRAPE_VARIETIES, fmt } from '@/constants/game';
import { VineyardBG } from '@/scenes';

export default function VineyardScreen() {
  const { money, unlockedVarieties, activeVariety } = useGameStore(s => ({
    money:             s.money,
    unlockedVarieties: s.unlockedVarieties,
    activeVariety:     s.activeVariety,
  }));

  const unlock = (variety) => {
    const { money } = useGameStore.getState();
    if (money < variety.unlockCost) return;
    useGameStore.setState(s => ({
      money: s.money - variety.unlockCost,
      unlockedVarieties: [...s.unlockedVarieties, variety.id],
      activeVariety: variety.id,
    }));
  };

  return (
    <div className="screen">
      <VineyardBG />
      <div className="screen-content">
        <h2 className="screen-title">🍇 Vineyard</h2>
        <p className="screen-subtitle">Select your active grape variety</p>

        <div className="variety-grid">
          {GRAPE_VARIETIES.filter(v => !v.prem).map(v => {
            const owned    = unlockedVarieties.includes(v.id);
            const active   = activeVariety === v.id;
            const canBuy   = !owned && money >= v.unlockCost;
            return (
              <div
                key={v.id}
                className={`variety-card ${active ? 'active' : ''} ${!owned ? 'locked' : ''}`}
                onClick={() => {
                  if (owned) useGameStore.setState({ activeVariety: v.id });
                  else if (canBuy) unlock(v);
                }}
              >
                <div className="variety-emoji">{v.emoji}</div>
                <div className="variety-name">{v.name}</div>
                <div className="variety-stats">
                  <span>🍷 ×{v.wineMultiplier}</span>
                  <span>⏱ {v.growTime}s</span>
                </div>
                {!owned && (
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
      </div>
    </div>
  );
}

import { useGameStore } from '@/hooks/useGameState';
import { fmt } from '@/constants/game';

export default function HUD() {
  const { money, grapes, barrels, wine, fame } = useGameStore(s => ({
    money:   s.money,
    grapes:  s.grapes,
    barrels: s.barrels,
    wine:    s.wine,
    fame:    s.fame,
  }));

  return (
    <header className="hud">
      <div className="hud-stat"><span>💰</span><span>${fmt(money)}</span></div>
      <div className="hud-stat"><span>🍇</span><span>{fmt(grapes)}</span></div>
      <div className="hud-stat"><span>🛢️</span><span>{fmt(barrels)}</span></div>
      <div className="hud-stat"><span>📦</span><span>{fmt(wine)}</span></div>
      <div className="hud-stat"><span>⭐</span><span>{Math.floor(fame)}</span></div>
    </header>
  );
}

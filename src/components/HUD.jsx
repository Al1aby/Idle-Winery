import { useGameStore } from '@/hooks/useGameState';
import { fmt } from '@/constants/game';

export default function HUD() {
  const { money, grapes, wine, fame, seasonIdx } = useGameStore(s => ({
    money:     s.money,
    grapes:    s.grapes,
    wine:      s.wine,
    fame:      s.fame,
    seasonIdx: s.seasonIdx,
  }));

  const SEASON_EMOJIS = ['🌸', '☀️', '🍂', '❄️'];

  return (
    <header className="hud">
      <div className="hud-stat"><span>💰</span><span>${fmt(money)}</span></div>
      <div className="hud-stat"><span>🍇</span><span>{fmt(grapes)}</span></div>
      <div className="hud-stat"><span>🍷</span><span>{fmt(wine)}</span></div>
      <div className="hud-stat"><span>⭐</span><span>{Math.floor(fame)}</span></div>
      <div className="hud-season">{SEASON_EMOJIS[seasonIdx]}</div>
    </header>
  );
}

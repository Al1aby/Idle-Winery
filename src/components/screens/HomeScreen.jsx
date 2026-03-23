import { useGameStore } from '@/hooks/useGameState';
import { fmt, GRAPE_VARIETIES, SEASONS_DATA } from '@/constants/game';
import { HomeBG } from '@/scenes';

export default function HomeScreen() {
  const {
    money, grapes, wine, fame, prestige,
    activeVariety, unlockedVarieties, seasonIdx, seasonSecs,
    harvestGrapes, setTab,
  } = useGameStore(s => ({
    money:              s.money,
    grapes:             s.grapes,
    wine:               s.wine,
    fame:               s.fame,
    prestige:           s.prestige,
    activeVariety:      s.activeVariety,
    unlockedVarieties:  s.unlockedVarieties,
    seasonIdx:          s.seasonIdx,
    seasonSecs:         s.seasonSecs,
    harvestGrapes:      s.harvestGrapes,
    setTab:             s.setTab,
  }));

  const season = SEASONS_DATA[seasonIdx];
  const variety = GRAPE_VARIETIES.find(v => v.id === activeVariety);

  return (
    <div className="screen">
      <HomeBG />

      <div className="screen-content">
        {/* Season banner */}
        <div className="season-banner">
          {season.emoji} {season.label}
          <span className="season-timer"> {Math.ceil(seasonSecs)}s</span>
        </div>

        {/* Prestige badge */}
        {prestige > 0 && (
          <div className="prestige-badge">✨ Prestige {prestige}</div>
        )}

        {/* Main harvest button */}
        <button className="harvest-btn" onClick={harvestGrapes}>
          <span className="harvest-emoji">{variety.emoji}</span>
          <span className="harvest-label">Harvest {variety.name}</span>
        </button>

        {/* Resource cards */}
        <div className="stat-row">
          {[
            { emoji: '💰', label: 'Money',  value: `$${fmt(money)}`       },
            { emoji: '🍇', label: 'Grapes', value: fmt(grapes)            },
            { emoji: '🍷', label: 'Wine',   value: `${fmt(wine)} bottles` },
            { emoji: '⭐', label: 'Fame',   value: Math.floor(fame)       },
          ].map(({ emoji, label, value }) => (
            <div key={label} className="stat-card">
              <div className="stat-emoji">{emoji}</div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick nav */}
        <div className="quick-nav">
          {[
            ['⚙️',  'press',    'Press'],
            ['💎',  'shop',     'Upgrades'],
            ['🚢',  'export',   'Export'],
            ['✨',  'prestige', 'Prestige'],
          ].map(([emoji, id, label]) => (
            <button key={id} className="quick-btn" onClick={() => setTab(id)}>
              {emoji} {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

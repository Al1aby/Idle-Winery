import { useGameStore } from '@/hooks/useGameState';
import { fmt, GRAPE_VARIETIES } from '@/constants/game';
import { HomeBG } from '@/scenes';

export default function HomeScreen() {
  const {
    money, grapes, barrels, wine, fame, prestigeLvl,
    activeVariety, setTab,
  } = useGameStore(s => ({
    money:         s.money,
    grapes:        s.grapes,
    barrels:       s.barrels,
    wine:          s.wine,
    fame:          s.fame,
    prestigeLvl:   s.prestigeLvl,
    activeVariety: s.activeVariety,
    setTab:        s.setTab,
  }));

  const variety = GRAPE_VARIETIES.find(v => v.id === activeVariety);

  return (
    <div className="screen">
      <HomeBG />

      <div className="screen-content">
        {prestigeLvl > 0 && (
          <div className="prestige-badge">✨ Prestige {prestigeLvl}</div>
        )}

        <div className="home-winery-label">
          <span className="home-winery-emoji">{variety.emoji}</span>
          <span className="home-winery-name">{variety.name} Winery</span>
        </div>

        {/* Resource overview */}
        <div className="stat-row stat-row-wide">
          {[
            { emoji: '💰', label: 'Money',   value: `$${fmt(money)}`    },
            { emoji: '🍇', label: 'Grapes',  value: fmt(grapes)         },
            { emoji: '🛢️', label: 'Barrels', value: fmt(barrels)        },
            { emoji: '🍷', label: 'Wine',    value: `${fmt(wine)} btl`  },
            { emoji: '⭐', label: 'Fame',    value: Math.floor(fame)    },
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
            ['🍇', 'vineyard', 'Vineyard'],
            ['🛢️', 'press',    'Press'],
            ['🪣', 'cellar',   'Cellar'],
            ['🚢', 'export',   'Export'],
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

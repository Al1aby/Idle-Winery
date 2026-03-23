import { useGameStore } from '@/hooks/useGameState';

const TABS = [
  { id: 'home',    label: 'Home',    emoji: '🏠' },
  { id: 'vineyard',label: 'Vines',   emoji: '🍇' },
  { id: 'press',   label: 'Press',   emoji: '⚙️'  },
  { id: 'cellar',  label: 'Cellar',  emoji: '🪣' },
  { id: 'export',  label: 'Export',  emoji: '🚢' },
  { id: 'lab',     label: 'Lab',     emoji: '🔬' },
  { id: 'events',  label: 'Events',  emoji: '🎪' },
  { id: 'shop',    label: 'Shop',    emoji: '🛍️'  },
  { id: 'prestige',label: 'Prestige',emoji: '✨' },
];

export default function TabBar() {
  const { tab, setTab } = useGameStore(s => ({ tab: s.tab, setTab: s.setTab }));

  return (
    <nav className="tab-bar">
      {TABS.map(t => (
        <button
          key={t.id}
          className={`tab-btn ${tab === t.id ? 'active' : ''}`}
          onClick={() => setTab(t.id)}
          aria-label={t.label}
        >
          <span className="tab-emoji">{t.emoji}</span>
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

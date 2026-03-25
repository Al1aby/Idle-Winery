import { useGameStore } from '@/hooks/useGameState';
import { PrestigeBG } from '@/scenes';

export default function PrestigeScreen() {
  const { fame, prestigeLvl, money, wine } = useGameStore(s => ({
    fame:        s.fame,
    prestigeLvl: s.prestigeLvl,
    money:       s.money,
    wine:        s.wine,
  }));

  const doPrestige = useGameStore(s => s.prestige);  // action function
  const fameNeeded = 1000;
  const canPrestige = fame >= fameNeeded;

  return (
    <div className="screen">
      <PrestigeBG />
      <div className="screen-content">
        <h2 className="screen-title">✨ Prestige</h2>

        <div className="prestige-info">
          <div className="prestige-count">Prestige Level: <strong>{prestigeLvl}</strong></div>
          <div className="prestige-bonus">
            {prestigeLvl > 0 && `+${prestigeLvl * 10}% all production`}
          </div>
        </div>

        <div className="fame-bar-container">
          <div className="fame-bar">
            <div
              className="fame-bar-fill"
              style={{ width: `${Math.min(100, (fame / fameNeeded) * 100)}%` }}
            />
          </div>
          <div className="fame-label">⭐ {Math.floor(fame)} / {fameNeeded} Fame</div>
        </div>

        <div className="prestige-warning">
          <h3>⚠️ This will reset:</h3>
          <ul>
            <li>Money, Grapes, Barrels, Wine</li>
            <li>Upgrades &amp; Staff</li>
            <li>Export progress</li>
          </ul>
          <h3>✅ You keep:</h3>
          <ul>
            <li>Prestige level &amp; bonus</li>
            <li>Unlocked varieties</li>
            <li>IAP purchases</li>
          </ul>
        </div>

        <button
          className={`prestige-btn ${canPrestige ? '' : 'disabled'}`}
          onClick={doPrestige}
          disabled={!canPrestige}
        >
          {canPrestige ? '✨ Prestige Now' : `Need ${fameNeeded - Math.floor(fame)} more Fame`}
        </button>
      </div>
    </div>
  );
}

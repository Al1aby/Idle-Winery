import { useGameStore } from '@/hooks/useGameState';
import { GRAPE_VARIETIES, BLEND_BONUS, fmt } from '@/constants/game';
import { LabBG } from '@/scenes';

export default function LabScreen() {
  const { wine, unlockedVarieties, blendA, blendB, blendResult, setBlend, createBlend } = useGameStore(s => ({
    wine:              s.wine,
    unlockedVarieties: s.unlockedVarieties,
    blendA:            s.blendA,
    blendB:            s.blendB,
    blendResult:       s.blendResult,
    setBlend:          s.setBlend,
    createBlend:       s.createBlend,
  }));

  const owned = GRAPE_VARIETIES.filter(v => unlockedVarieties.includes(v.id));
  const bonusKey = blendA && blendB ? `${blendA}+${blendB}` : null;
  const bonus = bonusKey ? (BLEND_BONUS[bonusKey] || 1.5) : null;

  return (
    <div className="screen">
      <LabBG />
      <div className="screen-content">
        <h2 className="screen-title">🔬 Blend Lab</h2>
        <p className="screen-subtitle">Combine two varieties for a premium cuvée</p>

        <div className="blend-row">
          {/* Slot A */}
          <div className="blend-slot">
            <div className="blend-slot-label">Variety A</div>
            <div className="blend-slot-value">{blendA ? GRAPE_VARIETIES.find(v => v.id === blendA)?.name : '—'}</div>
            <select
              className="blend-select"
              value={blendA || ''}
              onChange={e => setBlend('A', e.target.value)}
            >
              <option value="">Select…</option>
              {owned.map(v => <option key={v.id} value={v.id}>{v.emoji} {v.name}</option>)}
            </select>
          </div>

          <div className="blend-plus">+</div>

          {/* Slot B */}
          <div className="blend-slot">
            <div className="blend-slot-label">Variety B</div>
            <div className="blend-slot-value">{blendB ? GRAPE_VARIETIES.find(v => v.id === blendB)?.name : '—'}</div>
            <select
              className="blend-select"
              value={blendB || ''}
              onChange={e => setBlend('B', e.target.value)}
            >
              <option value="">Select…</option>
              {owned.map(v => <option key={v.id} value={v.id}>{v.emoji} {v.name}</option>)}
            </select>
          </div>
        </div>

        {bonus && (
          <div className="blend-preview">
            Blend bonus: <strong>×{bonus}</strong>
            {bonus >= 2.5 && ' 🌟 Rare pairing!'}
          </div>
        )}

        <button
          className={`action-btn ${(!blendA || !blendB || wine < 2) ? 'disabled' : ''}`}
          onClick={createBlend}
          disabled={!blendA || !blendB || wine < 2}
        >
          Create Blend (costs 2 📦)
        </button>

        {blendResult && (
          <div className="blend-result">
            🥂 <strong>{blendResult.name}</strong> — ×{blendResult.bonus} value!
          </div>
        )}

        {/* Known synergies */}
        <h3 className="section-title">Known Synergies</h3>
        <div className="synergy-list">
          {Object.entries(BLEND_BONUS).filter(([k]) => !k.includes('+') || k.split('+')[0] <= k.split('+')[1]).map(([key, mult]) => {
            const [a, b] = key.split('+');
            const vA = GRAPE_VARIETIES.find(v => v.id === a);
            const vB = GRAPE_VARIETIES.find(v => v.id === b);
            if (!vA || !vB) return null;
            return (
              <div key={key} className="synergy-row">
                <span>{vA.emoji} {vA.name} + {vB.emoji} {vB.name}</span>
                <span className="synergy-mult">×{mult}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useGameStore } from '@/hooks/useGameState';

export default function VisitorModal() {
  const { visitor, wine, acceptVisitor } = useGameStore(s => ({
    visitor:       s.visitor,
    wine:          s.wine,
    acceptVisitor: s.acceptVisitor,
  }));

  if (!visitor) return null;

  const canAfford = (visitor.costWine || 0) === 0 || wine >= visitor.costWine;

  return (
    <div className="modal-overlay">
      <div className="modal visitor-modal">
        <h2>👤 {visitor.name}</h2>
        <p>{visitor.desc}</p>
        {visitor.costWine > 0 && (
          <p style={{ fontSize: '0.7rem', color: canAfford ? 'var(--gold)' : '#e05555', marginBottom: 8 }}>
            Requires: {visitor.costWine} 🍾 wine {!canAfford && '(not enough)'}
          </p>
        )}
        <div className="modal-buttons">
          <button className="btn-primary" onClick={() => acceptVisitor(visitor)} disabled={!canAfford}>
            Accept
          </button>
          <button className="btn-secondary" onClick={() => useGameStore.setState({ visitor: null })}>
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

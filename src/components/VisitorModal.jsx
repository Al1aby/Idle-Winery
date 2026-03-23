import { useGameStore } from '@/hooks/useGameState';

export default function VisitorModal() {
  const { visitor, acceptVisitor } = useGameStore(s => ({
    visitor:       s.visitor,
    acceptVisitor: s.acceptVisitor,
  }));

  if (!visitor) return null;

  return (
    <div className="modal-overlay">
      <div className="modal visitor-modal">
        <h2>👤 {visitor.name}</h2>
        <p>{visitor.desc}</p>
        <div className="modal-buttons">
          <button className="btn-primary" onClick={() => acceptVisitor(visitor)}>
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

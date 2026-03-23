import { useGameStore } from '@/hooks/useGameState';

export default function Notification() {
  const notification = useGameStore(s => s.notification);
  if (!notification) return null;

  return (
    <div
      className="notification"
      style={{ borderColor: notification.color, color: notification.color }}
    >
      {notification.msg}
    </div>
  );
}

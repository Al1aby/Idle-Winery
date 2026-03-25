import { useGameStore } from '@/hooks/useGameState';

export default function Notification() {
  const notification = useGameStore(s => s.notification);
  if (!notification) return null;

  const msg   = typeof notification === 'string' ? notification : notification.msg;
  const color = typeof notification === 'object' && notification.color ? notification.color : '#c8953a';

  return (
    <div
      className="notification"
      style={{ borderColor: color, color }}
    >
      {msg}
    </div>
  );
}

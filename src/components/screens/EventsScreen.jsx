import { useGameStore } from '@/hooks/useGameState';
import { EVENTS_LIST, fmt, mmss } from '@/constants/game';
import { EventsBG } from '@/scenes';

export default function EventsScreen() {
  const { activeEvent, eventProgress, eventSecs, claimEvent } = useGameStore(s => ({
    activeEvent:   s.activeEvent,
    eventProgress: s.eventProgress,
    eventSecs:     s.eventSecs,
    claimEvent:    s.claimEvent,
  }));

  const startEvent = (ev) => {
    useGameStore.setState({ activeEvent: ev, eventProgress: 0, eventSecs: ev.secs });
  };

  const completed = activeEvent && eventProgress >= activeEvent.target;

  return (
    <div className="screen">
      <EventsBG />
      <div className="screen-content">
        <h2 className="screen-title">🎪 Tasting Events</h2>

        {activeEvent && (
          <div className="event-active">
            <div className="event-name">{activeEvent.name}</div>
            <div className="event-progress-bar">
              <div
                className="event-progress-fill"
                style={{ width: `${Math.min(100, (eventProgress / activeEvent.target) * 100)}%` }}
              />
            </div>
            <div className="event-progress-label">
              {Math.floor(eventProgress)} / {activeEvent.target}
            </div>
            {!completed && (
              <div className="event-timer">⏱ {mmss(eventSecs)}</div>
            )}
            <div className="event-reward">
              Reward: ${fmt(activeEvent.reward.money)} + {activeEvent.reward.fame} ⭐
            </div>
            {completed && (
              <button className="event-btn event-claim-btn" onClick={claimEvent}>
                🎉 Claim Reward
              </button>
            )}
          </div>
        )}

        {!activeEvent && (
          <div className="event-list">
            {EVENTS_LIST.map(ev => (
              <div key={ev.id} className="event-card">
                <div className="event-card-name">{ev.name}</div>
                <div className="event-card-desc">{ev.desc}</div>
                <div className="event-card-meta">
                  <span>⏱ {mmss(ev.secs)}</span>
                  <span>💰 ${fmt(ev.reward.money)}</span>
                  <span>⭐ +{ev.reward.fame}</span>
                </div>
                <button className="event-btn" onClick={() => startEvent(ev)}>
                  Start Event
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

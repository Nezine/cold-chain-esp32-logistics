import { statusLabel } from "../domain/status";

export default function RightPanel({ feedEntries, observerCount }) {
  return (
    <aside className="insights">
      <div className="panel">
        <div className="panel-header">
          <h3>Live Alert Feed</h3>
        </div>
        <p className="panel-note">
          New temperature alerts from the backend.
        </p>
        <div className="feed-list">
          {feedEntries.length === 0 ? (
            <p className="alert-empty">No events yet.</p>
          ) : (
            feedEntries.map((entry, index) => (
              <div
                key={`${entry.name}-${entry.time}-${index}`}
                className={`feed-item feed-item-${entry.status}`}
              >
                <b>{entry.name}</b>
                <span>
                  {statusLabel(entry.status)} · {entry.time}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="panel architecture-panel">
        <h3>Architecture</h3>
        <div className="arch-row">
          <span>Repository</span>
          <b>ShipmentRepository</b>
        </div>
        <div className="arch-row">
          <span>Subject</span>
          <b>TemperatureSubject</b>
        </div>
        <div className="arch-row">
          <span>Observers</span>
          <b>{observerCount}</b>
        </div>
      </div>
    </aside>
  );
}

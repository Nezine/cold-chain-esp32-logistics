import { statusLabel } from "../domain/status";
import { formatTemperature, formatTime } from "../domain/format";

export default function RightPanel({ feedEntries, shipments = [], alerts = [], observerCount }) {
  const nameById = new Map(shipments.map((item) => [item.id, item.name]));
  const alertById = new Map(alerts.map((item) => [item.id, item]));

  return (
    <aside className="insights">
      <div className="panel">
        <div className="panel-header">
          <h3>Live Alert Feed</h3>
        </div>
        <p className="panel-note">
          Observer Pattern — each new alert calls notify().
        </p>
        <div className="feed-list">
          {feedEntries.length === 0 ? (
            <p className="alert-empty">No events yet.</p>
          ) : (
            feedEntries.map((entry) => {
              const responded = alertById.get(entry.id)?.responseStatus === "responded";
              return (
                <div key={entry.id} className={`feed-item feed-item-${entry.severity}`}>
                  <b>{nameById.get(entry.shipmentId) || `Shipment #${entry.shipmentId}`}</b>
                  <span>
                    {statusLabel(entry.severity)} · {formatTemperature(entry.temperature)} ·{" "}
                    {formatTime(entry.time)}
                  </span>
                  {responded && <em className="feed-tag">Responded</em>}
                </div>
              );
            })
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

import { statusLabel } from "../domain/status";
import { formatTemperature, formatTime } from "../domain/format";
import { actionLabel } from "../domain/responseActions";

// Pending alerts first (they need action), then newest first.
function byPriority(a, b) {
  const pendingA = a.responseStatus === "pending" ? 0 : 1;
  const pendingB = b.responseStatus === "pending" ? 0 : 1;
  return pendingA - pendingB || b.id - a.id;
}

export default function AlertPanel({
  alerts = [],
  shipments = [],
  title = "Live Alerts",
  limit = 6,
}) {
  const nameById = new Map(shipments.map((item) => [item.id, item.name]));
  const sorted = [...alerts].sort(byPriority);
  const shown = sorted.slice(0, limit);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
      </div>
      {shown.length === 0 ? (
        <p className="alert-empty">No alerts.</p>
      ) : (
        shown.map((alert) => {
          const responded = alert.responseStatus === "responded";
          return (
            <div key={alert.id} className="alert-item">
              <div className="alert-main">
                <span className="alert-name">
                  {nameById.get(alert.shipmentId) || `Shipment #${alert.shipmentId}`}
                </span>
                <span className="alert-meta">
                  {formatTemperature(alert.temperature)} · {formatTime(alert.time)}
                </span>
                {responded && alert.response && (
                  <span className="alert-meta">
                    {actionLabel(alert.response.action)}
                    {alert.response.note ? ` — ${alert.response.note}` : ""}
                  </span>
                )}
              </div>
              <div className="alert-tags">
                <span className={`status ${alert.severity}`}>{statusLabel(alert.severity)}</span>
                <span className={`status response-${responded ? "responded" : "pending"}`}>
                  {statusLabel(responded ? "responded" : "pending")}
                </span>
              </div>
            </div>
          );
        })
      )}
      {sorted.length > shown.length && (
        <p className="alert-more">
          Showing {shown.length} of {sorted.length} alerts.
        </p>
      )}
    </div>
  );
}

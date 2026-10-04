import { getStatus, statusLabel } from "../domain/status";

export default function AlertPanel({ shipments, title = "Live Alerts" }) {
  const alerts = shipments.filter((item) => getStatus(item) !== "normal");

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
      </div>
      {alerts.length === 0 ? (
        <p className="alert-empty">No alerts.</p>
      ) : (
        alerts.map((item) => {
          const status = getStatus(item);
          return (
            <div key={item.id} className="alert-item">
              <span>{item.name}</span>
              <span className={`status ${status}`}>{statusLabel(status)}</span>
            </div>
          );
        })
      )}
    </div>
  );
}

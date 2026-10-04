import { getStatus, statusLabel } from "../domain/status";

export default function DetailPanel({ shipment, onResolve }) {
  if (!shipment) {
    return (
      <div className="panel">
        <h2>Shipment details</h2>
        <div className="empty-state">Select a shipment to view details</div>
      </div>
    );
  }

  const status = getStatus(shipment);

  return (
    <div className="panel">
      <h2>Shipment details</h2>
      <h3>{shipment.name}</h3>
      <p className="label">Current temperature</p>
      <h1 id="detailTemp">
        {shipment.connection === "ok" ? `${shipment.temperature}°C` : "—"}
      </h1>
      <div className="safe-range">
        Safe range: {shipment.min}°C - {shipment.max}°C
      </div>
      <div className={`status-badge status ${status}`}>{statusLabel(status)}</div>

      <h4>Recent history</h4>
      <ul id="historyList">
        {shipment.history.length === 0 ? (
          <li>No data yet</li>
        ) : (
          shipment.history.map((temp, index) => <li key={index}>{temp}°C</li>)
        )}
      </ul>

      <button id="resolveBtn" onClick={() => onResolve(shipment)}>
        Mark as resolved
      </button>
    </div>
  );
}

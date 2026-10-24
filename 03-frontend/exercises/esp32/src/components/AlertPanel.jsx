import { statusLabel } from '../domain/status';

export default function AlertPanel({ shipments, alerts = [], title = 'Alert history', onSelect }) {
  const byId = new Map(shipments.map((shipment) => [shipment.id, shipment]));
  const visible = alerts.filter((alert) => byId.has(alert.shipmentId));
  return (
    <div className="panel">
      <div className="panel-header"><h2>{title}</h2></div>
      {visible.length === 0 ? <p className="alert-empty">No alerts.</p> : [...visible].reverse().map((alert) => (
        <div key={alert.id} className="alert-item">
          <div>
            <button className="alert-link" onClick={() => onSelect?.(byId.get(alert.shipmentId))}>{byId.get(alert.shipmentId).name} · Alert #{alert.id}</button>
            <p>{alert.temperature}°C · {new Date(alert.time).toLocaleString()}</p>
            <p>{alert.responseStatus === 'responded' ? 'Responded' : 'Pending response'}</p>
            {alert.response && <p>{alert.response.action}: {alert.response.note}</p>}
          </div>
          <span className={`status ${alert.severity}`}>{statusLabel(alert.severity)}</span>
        </div>
      ))}
    </div>
  );
}

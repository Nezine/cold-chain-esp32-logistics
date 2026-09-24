import { getStatus, statusLabel } from "../domain/status";

export default function ShipmentCard({ shipment, onSelect }) {
  const status = getStatus(shipment);

  return (
    <div className="shipment" onClick={() => onSelect?.(shipment)}>
      <div>
        <h3>{shipment.name}</h3>
        <p>{shipment.connection === "ok" ? `${shipment.temperature}°C` : "Waiting for data..."}</p>
      </div>
      <span className={`status ${status}`}>{statusLabel(status)}</span>
    </div>
  );
}

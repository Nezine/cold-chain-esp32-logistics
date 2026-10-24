import { getStatus, hasReading, statusLabel } from "../domain/status";
import { formatTemperature } from "../domain/format";

export default function ShipmentCard({ shipment, onSelect }) {
  const status = getStatus(shipment);

  return (
    <div className="shipment" onClick={() => onSelect?.(shipment)}>
      <div>
        <h3>{shipment.name}</h3>
        <p>{hasReading(shipment) ? formatTemperature(shipment.temperature) : "Waiting for data..."}</p>
      </div>
      <span className={`status ${status}`}>{statusLabel(status)}</span>
    </div>
  );
}

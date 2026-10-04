import ShipmentCard from "../components/ShipmentCard";

export default function Shipments({ shipments }) {
  return (
    <div className="panel">
      <h2>All Shipments</h2>
      {shipments.map((item) => (
        <ShipmentCard key={item.id} shipment={item} />
      ))}
    </div>
  );
}

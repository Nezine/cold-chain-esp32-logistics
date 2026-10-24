import ShipmentCard from "../components/ShipmentCard";
import DetailPanel from "../components/DetailPanel";
import AlertPanel from "../components/AlertPanel";
import StatCard from "../components/StatCard";
import { getStatus } from "../domain/status";

export default function Dashboard({
  shipments,
  alerts,
  selectedShipment,
  setSelectedShipment,
  onRespond,
  search,
}) {
  const keyword = search.toLowerCase();
  const visible = shipments.filter((item) =>
    item.name.toLowerCase().includes(keyword)
  );
  const visibleIds = new Set(visible.map((item) => item.id));
  const visibleAlerts = alerts.filter((alert) => visibleIds.has(alert.shipmentId));

  // Severity comes from the backend; shipments without a live reading
  // (loading/timeout/error) are not counted as normal.
  const counts = shipments.reduce(
    (acc, item) => {
      const status = getStatus(item);
      if (status in acc) acc[status] += 1;
      return acc;
    },
    { normal: 0, warning: 0, critical: 0 }
  );
  const waiting = shipments.length - counts.normal - counts.warning - counts.critical;

  return (
    <>
      <section className="stats">
        <StatCard
          title="Total shipments"
          value={shipments.length}
          className="stat-gradient"
          trend={waiting > 0 ? `${waiting} waiting for live data` : "All sensors reporting"}
        />
        <StatCard title="Normal" value={counts.normal} className="normal-card" />
        <StatCard title="Warning" value={counts.warning} className="warning-card" />
        <StatCard title="Critical" value={counts.critical} className="critical-card" />
      </section>

      <section className="content">
        <div className="panel">
          <div className="panel-header">
            <h2>Shipments</h2>
          </div>
          {visible.length === 0 && <p>No shipments. Create one to get started.</p>}
          {visible.map((item) => (
            <ShipmentCard
              key={item.id}
              shipment={item}
              onSelect={setSelectedShipment}
            />
          ))}
        </div>

        <DetailPanel
          key={selectedShipment ? selectedShipment.id : "none"}
          shipment={selectedShipment}
          alerts={alerts}
          onRespond={onRespond}
        />
      </section>

      <AlertPanel alerts={visibleAlerts} shipments={shipments} />
    </>
  );
}

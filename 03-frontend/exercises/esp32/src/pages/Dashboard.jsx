import ShipmentCard from "../components/ShipmentCard";
import DetailPanel from "../components/DetailPanel";
import AlertPanel from "../components/AlertPanel";
import StatCard from "../components/StatCard";
import { getSeverity } from "../domain/status";

export default function Dashboard({
  shipments,
  selectedShipment,
  setSelectedShipment,
  onResolve,
  search,
}) {
  const keyword = search.toLowerCase();
  const visible = shipments.filter((item) =>
    item.name.toLowerCase().includes(keyword)
  );

  const counts = shipments.reduce(
    (acc, item) => {
      acc[getSeverity(item)] += 1;
      return acc;
    },
    { normal: 0, warning: 0, critical: 0 }
  );

  return (
    <>
      <section className="stats">
        <StatCard
          title="Total shipments"
          value={shipments.length}
          className="stat-gradient"
          trend="Repository: 5 shipments tracked"
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
          {visible.map((item) => (
            <ShipmentCard
              key={item.id}
              shipment={item}
              onSelect={setSelectedShipment}
            />
          ))}
        </div>

        <DetailPanel shipment={selectedShipment} onResolve={onResolve} />
      </section>

      <AlertPanel shipments={visible} />
    </>
  );
}

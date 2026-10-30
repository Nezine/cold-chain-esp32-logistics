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
      if (item.temperature !== null) acc[getSeverity(item)] += 1;
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
          trend="Lưu trữ SQLite · cập nhật mỗi 2 giây"
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
          <p>Hiển thị {visible.length}/{shipments.length} chuyến{search ? ` · Đang lọc: ${search}` : ""}</p>
          {visible.length === 0 && <p>Không có chuyến phù hợp. Hãy xóa nội dung ô tìm kiếm để xem tất cả.</p>}
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

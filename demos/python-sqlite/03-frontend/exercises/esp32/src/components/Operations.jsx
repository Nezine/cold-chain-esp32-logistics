import { useState } from "react";
import { createShipment, sendReading, dispatchShipment } from "../services/shipmentService";

export default function Operations({ shipments, onChange, selectedId, onSelect, onCreated }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("Hàng lạnh demo");
  const [vehicle, setVehicle] = useState("XE-LANH-01");
  const [temperature, setTemperature] = useState("5");
  const shipment = shipments.find(s => s.id === selectedId) || shipments[0];
  async function run(action) {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try { await action(); await onChange(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  const reading = value => run(() => sendReading({ shipmentId: shipment.id,
    deviceId: shipment.deviceId, readingId: crypto.randomUUID(), temperature: Number(value),
    unit: "C", time: new Date().toISOString() }));
  return <section className="panel operations">
    <h2>Điều phối & mô phỏng cảm biến</h2>
    <form onSubmit={e => { e.preventDefault(); run(async () => {
      const result = await createShipment({ name, min: 2, max: 8, deviceId: `sensor-${crypto.randomUUID()}` });
      onCreated(result);
      setNotice(`Đã tạo chuyến #${result.id} — ${result.name}. Bạn có thể tiếp tục tạo chuyến khác.`);
    }); }}>
      <label>Tên chuyến <input required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label>
      <button type="submit" disabled={busy}>Tạo chuyến (2–8°C)</button>
    </form>
    {notice && <p role="status">{notice}</p>}
    <p>Tổng số chuyến: {shipments.length}. Mỗi lần bấm Tạo chuyến tạo một mã mới, kể cả khi trùng tên.</p>
    {shipment && <fieldset disabled={busy}>
      <legend>Chuyến đang thao tác</legend>
      <select aria-label="Chọn chuyến" value={String(shipment.id)} onChange={e => onSelect(Number(e.target.value))}>
        {shipments.map(s => <option key={s.id} value={s.id}>#{s.id} — {s.name}</option>)}
      </select>
      <p>Trạng thái: {shipment.status} · Xe: {shipment.vehicle || "Chưa phân xe"} · Sensor: {shipment.deviceId}</p>
      <label>Mã xe <input value={vehicle} onChange={e => setVehicle(e.target.value)} /></label>
      <button disabled={shipment.status !== "planned"} onClick={() => run(() => dispatchShipment(shipment.id, {vehicle, status: "in_transit"}))}>Phân xe & xuất phát</button>
      <button disabled={shipment.status !== "in_transit"} onClick={() => run(() => dispatchShipment(shipment.id, {vehicle: shipment.vehicle, status: "delivered"}))}>Hoàn tất giao hàng</button>
      <div>
        <label>Nhiệt độ °C <input type="number" step="0.1" value={temperature} onChange={e => setTemperature(e.target.value)} /></label>
        <button disabled={shipment.status === "delivered" || temperature === ""} onClick={() => reading(temperature)}>Gửi số đo</button>
        {[5, 9, 12, -1].map(t => <button key={t} disabled={shipment.status === "delivered"} onClick={() => reading(t)}>{t}°C</button>)}
      </div>
      <p>Chuỗi demo: 5 → 9 → 12 → ghi nhận xử lý → 5°C → hoàn tất. Ngừng gửi trên 30 giây để xem mất tín hiệu.</p>
    </fieldset>}
    {error && <p role="alert">{error}</p>}
  </section>;
}

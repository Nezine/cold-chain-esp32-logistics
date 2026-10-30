import { useState } from "react";
import { getStatus, statusLabel } from "../domain/status";
export default function DetailPanel({ shipment, onResolve }) {
  const [note, setNote] = useState("");
  const [action, setAction] = useState("moved_to_backup_cooler");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!shipment) return <div className="panel"><h2>Chi tiết chuyến</h2><p>Chọn một chuyến để xem chi tiết và xử lý cảnh báo.</p></div>;
  const status = getStatus(shipment);
  const active = shipment.alerts?.find(a => !a.recovered);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    try { await onResolve(shipment, {alertId: active.id, action, note}); setNote(""); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <div className="panel">
    <h2>{shipment.name}</h2>
    <p>Mã chuyến: #{shipment.id}</p>
    <h1>{shipment.temperature === null ? "—" : `${shipment.temperature}°C`}</h1>
    <p>Khoảng an toàn: {shipment.min}–{shipment.max}°C</p>
    <span className={`status ${status}`}>{statusLabel(status)}</span>
    <p>Số đo cuối: {shipment.lastReadingAt ? new Date(shipment.lastReadingAt).toLocaleString() : "Chưa có"}</p>
    <p>Trạng thái: {shipment.status} · Xe: {shipment.vehicle || "Chưa phân xe"}</p>
    <h4>Lịch sử nhiệt độ (tối đa 60 số đo gần nhất)</h4>
    <p>{shipment.history.length ? shipment.history.join(" → ") : "Chưa có số đo"}</p>
    {active && <form onSubmit={submit}>
      <label>Hành động <select value={action} onChange={e => setAction(e.target.value)}>
        <option value="moved_to_backup_cooler">Chuyển sang thùng lạnh dự phòng</option>
        <option value="inspect_refrigeration">Kiểm tra hệ thống làm lạnh</option>
        <option value="contact_driver">Liên hệ tài xế</option>
      </select></label>
      <label>Ghi chú <input required maxLength={500} value={note} onChange={e => setNote(e.target.value)} /></label>
      <button disabled={busy}>Ghi nhận xử lý</button>
      <p>Xác nhận xử lý không đổi nhiệt độ. Cần số đo mới để xác nhận phục hồi.</p>
    </form>}
    {error && <p role="alert">{error}</p>}
    <h4>Nhật ký cảnh báo & xử lý</h4>
    {!shipment.alerts?.length && <p>Chưa có cảnh báo nhiệt độ.</p>}
    {shipment.alerts?.map(a => <div key={a.id} className="alert-item">
      <div><b>#{a.id} {a.severity} · {a.status}</b><p>{new Date(a.opened).toLocaleString()}</p>
      {a.responses.map(r => <p key={r.id}>{r.action}: {r.note} ({new Date(r.time).toLocaleString()})</p>)}</div>
    </div>)}
  </div>;
}

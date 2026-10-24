import { useState } from 'react';
import { getStatus, statusLabel } from '../domain/status';

export default function DetailPanel({ shipment, alerts = [], onRespond }) {
  const [selectedAlert, setSelectedAlert] = useState('');
  const [action, setAction] = useState('inspected_shipment');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  if (!shipment) return <div className="panel"><h2>Shipment details</h2><div className="empty-state">Select a shipment to view details</div></div>;

  const status = getStatus(shipment);
  const pending = alerts.filter((alert) => alert.responseStatus === 'pending');
  const target = pending.find((alert) => String(alert.id) === selectedAlert) || pending[0];
  const submit = async (event) => {
    event.preventDefault();
    if (!target || busy) return;
    setBusy(true); setError(''); setSaved(false);
    try {
      await onRespond(shipment.id, { alertId: target.id, action, note });
      setNote(''); setSaved(true);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="panel">
      <h2>Shipment details</h2><h3>{shipment.name}</h3>
      <p className="label">Current temperature</p>
      <h1 id="detailTemp">{shipment.connection === 'ok' ? `${shipment.temperature}°C` : '—'}</h1>
      <div className="safe-range">Safe range: {shipment.min}°C - {shipment.max}°C</div>
      <div className={`status-badge status ${status}`}>{statusLabel(status)}</div>
      <h4>Recent history</h4>
      <ul id="historyList">{shipment.history.length === 0 ? <li>No data yet</li> : shipment.history.map((temp, index) => <li key={index}>{temp}°C</li>)}</ul>
      {pending.length > 0 ? (
        <form className="integration-form" onSubmit={submit}>
          <h4>Record dispatch response</h4>
          <label htmlFor="dispatch-alert">Alert</label><select id="dispatch-alert" value={target ? String(target.id) : ''} onChange={(e) => { setSelectedAlert(e.target.value); setSaved(false); }}>
            {pending.map((alert) => <option key={alert.id} value={alert.id}>#{alert.id} · {statusLabel(alert.severity)} · {alert.temperature}°C · {alert.time}</option>)}
          </select>
          <label htmlFor="dispatch-action">Action</label><select id="dispatch-action" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="inspected_shipment">Inspected shipment</option>
            <option value="moved_to_backup_cooler">Moved to backup cooler</option>
            <option value="contacted_driver">Contacted driver</option>
          </select>
          <label htmlFor="dispatch-note">Response note</label><textarea id="dispatch-note" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          <button id="resolveBtn" disabled={busy} type="submit">{busy ? 'Saving…' : 'Record response'}</button>
        </form>
      ) : <p>No pending alerts for this shipment.</p>}
      {saved && <p role="status">Response recorded. Measured temperature is unchanged.</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

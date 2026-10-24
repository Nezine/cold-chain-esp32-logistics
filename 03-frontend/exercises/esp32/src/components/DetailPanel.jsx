import { useState } from "react";
import { getStatus, hasReading, statusLabel } from "../domain/status";
import { formatTemperature, formatTime } from "../domain/format";
import { RESPONSE_ACTIONS, actionLabel } from "../domain/responseActions";

export default function DetailPanel({ shipment, alerts = [], onRespond }) {
  const [chosenAlertId, setChosenAlertId] = useState(null);
  const [action, setAction] = useState(RESPONSE_ACTIONS[0].value);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: "ok" | "error", text }

  if (!shipment) {
    return (
      <div className="panel">
        <h2>Shipment details</h2>
        <div className="empty-state">Select a shipment to view details</div>
      </div>
    );
  }

  const status = getStatus(shipment);
  const shipmentAlerts = alerts
    .filter((alert) => alert.shipmentId === shipment.id)
    .sort((a, b) => b.id - a.id);
  const pending = shipmentAlerts.filter((alert) => alert.responseStatus === "pending");
  // Newest pending alert unless the dispatcher picked another one that is still pending.
  const activeAlert = pending.find((alert) => alert.id === chosenAlertId) || pending[0] || null;
  const lastResponded = shipmentAlerts.find((alert) => alert.responseStatus === "responded");

  const submit = async (event) => {
    event.preventDefault();
    if (!activeAlert || submitting) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await onRespond(shipment.id, {
        alertId: activeAlert.id,
        action,
        note: note.trim(),
      });
      setNote("");
      setMessage({ type: "ok", text: `Response recorded for alert #${activeAlert.id}.` });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="panel">
      <h2>Shipment details</h2>
      <h3>{shipment.name}</h3>
      <p className="label">Current temperature</p>
      <h1 id="detailTemp">
        {hasReading(shipment) ? formatTemperature(shipment.temperature) : "—"}
      </h1>
      <div className="safe-range">
        Safe range: {shipment.min}°C - {shipment.max}°C
      </div>
      <div className={`status-badge status ${status}`}>{statusLabel(status)}</div>

      <h4>Recent history</h4>
      <ul id="historyList">
        {shipment.history.length === 0 ? (
          <li>No data yet</li>
        ) : (
          shipment.history.map((temp, index) => <li key={index}>{formatTemperature(temp)}</li>)
        )}
      </ul>

      <h4>Respond to alert</h4>
      {activeAlert ? (
        <form className="respond-form" onSubmit={submit}>
          <label>
            Alert
            <select
              value={activeAlert.id}
              onChange={(event) => setChosenAlertId(Number(event.target.value))}
            >
              {pending.map((alert) => (
                <option key={alert.id} value={alert.id}>
                  #{alert.id} · {statusLabel(alert.severity)} · {formatTemperature(alert.temperature)} ·{" "}
                  {formatTime(alert.time)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Action taken
            <select value={action} onChange={(event) => setAction(event.target.value)}>
              {RESPONSE_ACTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Note (optional)
            <textarea
              value={note}
              maxLength={1000}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What did you do?"
            />
          </label>
          <button type="submit" className="respond-btn" disabled={submitting}>
            {submitting ? "Saving…" : "Record response"}
          </button>
        </form>
      ) : (
        <p className="alert-empty">No alerts waiting for a response.</p>
      )}

      {message && (
        <p
          className={`form-message form-message-${message.type}`}
          role={message.type === "error" ? "alert" : "status"}
        >
          {message.text}
        </p>
      )}

      {lastResponded?.response && (
        <p className="response-summary">
          Last response (alert #{lastResponded.id}): {actionLabel(lastResponded.response.action)}
          {lastResponded.response.note ? ` — ${lastResponded.response.note}` : ""}
        </p>
      )}
    </div>
  );
}

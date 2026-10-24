import seed from "../data/shipments";
import ApiError from "./ApiError";

// In-memory stand-in for the real backend, used only when the app runs with
// REACT_APP_USE_MOCK=true (demo without the C++ backend). It returns the same
// JSON shapes as 02-domain-backend/docs/API_V1.md, so App.js has a single code
// path for both modes.

const DEFAULT_MARGIN = 2;
const HISTORY_LIMIT = 6;
const LATENCY_MS = 300;
const DEMO_SHIPMENT_ID = 5; // "Organ Transport Unit" in data/shipments.js

// Demo severity rule from API_V1.md. It lives here only because this file plays
// the backend; the real UI never computes severity.
function severityFor(temperature, min, max, margin) {
  if (temperature >= min && temperature <= max) return "normal";
  if (temperature >= min - margin && temperature <= max + margin) return "warning";
  return "critical";
}

const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const copy = (value) => JSON.parse(JSON.stringify(value));
const delay = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

const shipments = seed.map((item) => {
  const waiting = item.connection === "loading";
  const temperature = waiting ? null : item.temperature;
  return {
    ...item,
    criticalMargin: DEFAULT_MARGIN,
    temperature,
    history: [...item.history],
    severity:
      temperature === null
        ? "normal"
        : severityFor(temperature, item.min, item.max, DEFAULT_MARGIN),
  };
});
const alerts = [];
let nextAlertId = 1;
let nextReadingNumber = 1;

function addReading(shipment, temperature) {
  const time = nowIso();
  shipment.temperature = temperature;
  shipment.connection = "ok";
  shipment.history = [...shipment.history, temperature].slice(-HISTORY_LIMIT);
  shipment.severity = severityFor(
    temperature,
    shipment.min,
    shipment.max,
    shipment.criticalMargin
  );
  shipment.lastReadingAt = time;

  if (shipment.severity !== "normal") {
    alerts.push({
      id: nextAlertId++,
      shipmentId: shipment.id,
      readingId: `mock:${nextReadingNumber}`,
      severity: shipment.severity,
      temperature,
      time,
      responseStatus: "pending",
    });
  }
  nextReadingNumber += 1;
}

export async function getShipments() {
  await delay();
  return copy(shipments);
}

export async function getAlerts() {
  await delay();
  return copy(alerts);
}

export async function respondToAlert(shipmentId, { alertId, action, note = "" }) {
  await delay();
  const shipment = shipments.find((item) => item.id === shipmentId);
  if (!shipment) throw new ApiError("Shipment not found", 404);
  const alert = alerts.find(
    (item) => item.id === alertId && item.shipmentId === shipmentId
  );
  if (!alert) throw new ApiError("Alert not found for this shipment", 404);
  if (!action || !String(action).trim()) throw new ApiError("action must not be empty", 400);
  if (alert.responseStatus === "responded") {
    throw new ApiError("Alert already has a response", 409);
  }

  const response = { alertId, shipmentId, action, note, recordedAt: nowIso() };
  alert.responseStatus = "responded";
  alert.response = response;
  // Like the real backend: temperature, severity and readings stay untouched.
  return copy({ shipmentId, status: "responded", response });
}

// Mock ESP32: one connected shipment gets a new reading (random walk).
export function tick() {
  const readable = shipments.filter(
    (item) => item.connection === "ok" && item.temperature !== null
  );
  if (!readable.length) return;
  const target = readable[Math.floor(Math.random() * readable.length)];
  const next = Number((target.temperature + (Math.random() * 2 - 1)).toFixed(1));
  addReading(target, next);
}

// Settings demo: force a connection state on the demo shipment.
export function setConnection(state) {
  const target = shipments.find((item) => item.id === DEMO_SHIPMENT_ID);
  if (!target) return;
  if (state === "ok" && target.temperature === null) {
    addReading(target, Number(((target.min + target.max) / 2).toFixed(1)));
    return;
  }
  target.connection = state;
}

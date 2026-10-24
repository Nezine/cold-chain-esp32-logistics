import ApiError from "./ApiError";
import * as mockBackend from "./mockBackend";

// API mode is the default. Run with REACT_APP_USE_MOCK=true to demo the UI
// without the backend (in-memory data + simulated sensor).
export const USE_API = process.env.REACT_APP_USE_MOCK !== "true";

// In development the CRA proxy (src/setupProxy.js) forwards /api to the
// backend on 127.0.0.1:8080, so keep requests same-origin. Set
// REACT_APP_API_URL only when a reverse proxy is not available.
const BASE_URL = process.env.REACT_APP_API_URL || "/api";

async function request(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Cannot reach the backend. Is it running on port 8080?", 0);
  }

  let payload = null;
  let isJson = true;
  try {
    payload = await response.json();
  } catch {
    isJson = false; // empty or non-JSON body
  }

  if (!response.ok) {
    // Backend errors look like { "error": "..." }.
    throw new ApiError(
      payload?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }
  if (!isJson) {
    // Typical cause in development: the CRA proxy is not active, so the dev
    // server answers /api/... with the app's index.html instead of JSON.
    throw new ApiError(
      "Got a web page instead of JSON. Restart `npm start` so src/setupProxy.js is loaded, and check the backend is running on port 8080.",
      response.status
    );
  }
  return payload;
}

function expectArray(payload, name) {
  if (!Array.isArray(payload)) {
    throw new ApiError(`Unexpected response from ${name}: expected a list`, 500);
  }
  return payload;
}

// GET /api/shipments — severity and connection come from the backend.
// A new shipment has temperature: null, history: [] and connection: "loading".
export async function getShipments() {
  if (!USE_API) return mockBackend.getShipments();
  return expectArray(await request("/shipments"), "/shipments");
}

// GET /api/alerts — each alert has an id, severity, temperature and
// responseStatus ("pending" | "responded", plus `response` once responded).
export async function getAlerts() {
  if (!USE_API) return mockBackend.getAlerts();
  return expectArray(await request("/alerts"), "/alerts");
}

// POST /api/shipments/:id/responses — records what the dispatcher did.
// It never changes the measured temperature or the severity.
export async function respondToAlert(shipmentId, { alertId, action, note }) {
  if (!USE_API) return mockBackend.respondToAlert(shipmentId, { alertId, action, note });
  return request(`/shipments/${shipmentId}/responses`, {
    method: "POST",
    body: { alertId, action, ...(note ? { note } : {}) },
  });
}

// Mock-mode helpers (no-ops when talking to the real backend).
export function tickMockSensor() {
  if (!USE_API) mockBackend.tick();
}

export function simulateConnection(state) {
  if (!USE_API) mockBackend.setConnection(state);
}

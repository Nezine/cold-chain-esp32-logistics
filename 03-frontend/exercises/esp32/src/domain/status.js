const SEVERITIES = ["normal", "warning", "critical"];
const CONNECTION_PROBLEMS = ["loading", "timeout", "error"];

// Severity is decided by the backend (shipment.severity, rule in
// 02-domain-backend/docs/API_V1.md). The UI must not recompute it from
// temperature, otherwise the two sides can disagree.
//
// Connection problems (loading/timeout/error) take priority over severity.
// A missing or unknown value is shown as "error" instead of hiding a problem.
export function getStatus(shipment) {
  if (shipment.connection !== "ok") {
    return CONNECTION_PROBLEMS.includes(shipment.connection)
      ? shipment.connection
      : "error";
  }
  return SEVERITIES.includes(shipment.severity) ? shipment.severity : "error";
}

// True when the shipment has a real measured temperature to show.
export function hasReading(shipment) {
  return shipment.connection === "ok" && typeof shipment.temperature === "number";
}

export function statusLabel(status) {
  return (
    {
      normal: "NORMAL",
      warning: "WARNING",
      critical: "CRITICAL",
      loading: "LOADING",
      timeout: "TIMEOUT",
      error: "ERROR",
      pending: "PENDING",
      responded: "RESPONDED",
    }[status] || "UNKNOWN"
  );
}

// Backend owns severity; fallback follows the same classroom policy.
export function getSeverity(shipment) {
  if (shipment.severity) return shipment.severity;
  if (shipment.temperature < shipment.min - 2 || shipment.temperature > shipment.max + 2) return "critical";
  if (shipment.temperature < shipment.min || shipment.temperature > shipment.max) return "warning";
  return "normal";
}

// Connection errors (loading/timeout/error) override temperature.
export function getStatus(shipment) {
  return shipment.connection !== "ok" ? shipment.connection : getSeverity(shipment);
}

export function statusLabel(status) {
  return {
    normal: "NORMAL",
    warning: "WARNING",
    critical: "CRITICAL",
    loading: "LOADING",
    timeout: "TIMEOUT",
    error: "ERROR",
  }[status];
}

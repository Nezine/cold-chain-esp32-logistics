// Temperature band: critical > max, warning near max.
export function getSeverity(shipment) {
  if (shipment.temperature > shipment.max) return "critical";
  if (shipment.temperature > shipment.max - 1) return "warning";
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

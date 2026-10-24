// The backend owns classification, including lower-temperature excursions.
export function getSeverity(shipment) {
  return ['normal', 'warning', 'critical'].includes(shipment.severity)
    ? shipment.severity : 'error';
}

export function getStatus(shipment) {
  return shipment.connection !== 'ok' ? shipment.connection : getSeverity(shipment);
}

export function statusLabel(status) {
  return {
    normal: 'NORMAL', warning: 'WARNING', critical: 'CRITICAL',
    loading: 'LOADING', timeout: 'TIMEOUT', error: 'ERROR',
  }[status] || 'UNKNOWN';
}

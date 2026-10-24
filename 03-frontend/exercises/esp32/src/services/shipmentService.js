// Same-origin /api requests use the CRA development proxy, or a production reverse proxy.
async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`/api${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.error || `Backend unavailable (${response.status})`);
    if (body === null) throw new Error("Backend returned invalid JSON.");
    return body;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Backend request timed out. Please retry.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const getShipments = () => request('/shipments');
export const getAlerts = () => request('/alerts');
export const createShipment = (shipment) => request('/shipments', {
  method: 'POST', body: JSON.stringify(shipment),
});
export const recordResponse = (shipmentId, response) => request(`/shipments/${shipmentId}/responses`, {
  method: 'POST', body: JSON.stringify(response),
});

async function request(path, data) {
  const response = await fetch(`/api${path}`, data === undefined ? {} : {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed");
  return result;
}
export const getShipments = () => request("/shipments");
export const createShipment = data => request("/shipments", data);
export const sendReading = data => request("/readings", data);
export const recordResponse = (id, data) => request(`/shipments/${id}/responses`, data);
export const dispatchShipment = (id, data) => request(`/shipments/${id}/dispatch`, data);

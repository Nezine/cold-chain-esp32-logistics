import { getAlerts, getShipments, respondToAlert } from "./shipmentService";

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  delete global.fetch;
});

test("getShipments calls GET /api/shipments and returns the list", async () => {
  const list = [{ id: 1, severity: "normal" }];
  fetch.mockResolvedValue(jsonResponse(200, list));

  await expect(getShipments()).resolves.toEqual(list);
  expect(fetch).toHaveBeenCalledWith("/api/shipments", expect.objectContaining({ method: "GET" }));
});

test("getAlerts calls GET /api/alerts", async () => {
  fetch.mockResolvedValue(jsonResponse(200, []));
  await getAlerts();
  expect(fetch.mock.calls[0][0]).toBe("/api/alerts");
});

test("respondToAlert sends alertId, action and note to the shipment's responses endpoint", async () => {
  const reply = { shipmentId: 1, status: "responded", response: { alertId: 7 } };
  fetch.mockResolvedValue(jsonResponse(200, reply));

  await expect(
    respondToAlert(1, { alertId: 7, action: "contacted_driver", note: "Called" })
  ).resolves.toEqual(reply);

  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe("/api/shipments/1/responses");
  expect(options.method).toBe("POST");
  expect(options.headers).toEqual({ "Content-Type": "application/json" });
  expect(JSON.parse(options.body)).toEqual({
    alertId: 7,
    action: "contacted_driver",
    note: "Called",
  });
});

test("respondToAlert leaves the note out when it is empty", async () => {
  fetch.mockResolvedValue(jsonResponse(200, {}));
  await respondToAlert(1, { alertId: 7, action: "contacted_driver", note: "" });
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    alertId: 7,
    action: "contacted_driver",
  });
});

test("backend errors surface the { error } message and status", async () => {
  fetch.mockResolvedValue(jsonResponse(409, { error: "Alert already has a response" }));

  await expect(respondToAlert(1, { alertId: 7, action: "x" })).rejects.toMatchObject({
    message: "Alert already has a response",
    status: 409,
  });
});

test("a network failure becomes a readable error", async () => {
  fetch.mockRejectedValue(new TypeError("Failed to fetch"));
  await expect(getShipments()).rejects.toMatchObject({ status: 0 });
});

test("a non-list response is rejected", async () => {
  fetch.mockResolvedValue(jsonResponse(200, { oops: true }));
  await expect(getAlerts()).rejects.toThrow(/expected a list/);
});

test("an HTML page instead of JSON points at the proxy", async () => {
  // What CRA's dev server returns for /api/... when the proxy is not applied.
  fetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => {
      throw new SyntaxError("Unexpected token <");
    },
  });
  await expect(getShipments()).rejects.toThrow(/Restart `npm start`/);
});

import * as mockBackend from "./mockBackend";

afterEach(() => jest.restoreAllMocks());

test("mock backend behaves like the API: alerts, responses, untouched readings", async () => {
  // Math.random = 0.999 always picks the last connected shipment (Milk, 2–6°C)
  // and nudges it +1°C: 4.5 -> 5.5 -> 6.5 (above max, inside the margin = warning).
  jest.spyOn(Math, "random").mockReturnValue(0.999);
  mockBackend.tick();
  mockBackend.tick();

  const alerts = await mockBackend.getAlerts();
  expect(alerts).toHaveLength(1);
  expect(alerts[0]).toMatchObject({
    shipmentId: 4,
    severity: "warning",
    temperature: 6.5,
    responseStatus: "pending",
  });

  const reply = await mockBackend.respondToAlert(4, {
    alertId: alerts[0].id,
    action: "contacted_driver",
    note: "Called",
  });
  expect(reply).toMatchObject({ shipmentId: 4, status: "responded" });
  expect(reply.response).toMatchObject({ alertId: alerts[0].id, action: "contacted_driver" });

  // The response never rewrites the measurement or severity.
  const milk = (await mockBackend.getShipments()).find((item) => item.id === 4);
  expect(milk).toMatchObject({ temperature: 6.5, severity: "warning", connection: "ok" });

  // One response per alert, and alerts of other shipments are not reachable.
  await expect(
    mockBackend.respondToAlert(4, { alertId: alerts[0].id, action: "contacted_driver" })
  ).rejects.toMatchObject({ status: 409 });
  await expect(
    mockBackend.respondToAlert(1, { alertId: alerts[0].id, action: "contacted_driver" })
  ).rejects.toMatchObject({ status: 404 });
});

test("a shipment without readings starts with temperature null and connection loading", async () => {
  const organ = (await mockBackend.getShipments()).find((item) => item.id === 5);
  expect(organ).toMatchObject({ temperature: null, history: [], connection: "loading", severity: "normal" });
});

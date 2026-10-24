import { getStatus, hasReading, statusLabel } from "./status";

const base = { id: 1, name: "A", min: 2, max: 8, history: [] };

test("uses the severity sent by the backend instead of recomputing it", () => {
  // 9°C is above max: the old frontend rule said "critical", the backend says warning.
  const shipment = { ...base, temperature: 9, connection: "ok", severity: "warning" };
  expect(getStatus(shipment)).toBe("warning");
});

test("connection problems take priority over severity", () => {
  expect(getStatus({ ...base, temperature: 12, connection: "timeout", severity: "critical" })).toBe("timeout");
  expect(getStatus({ ...base, temperature: null, connection: "loading", severity: "normal" })).toBe("loading");
});

test("a missing or unknown severity is shown as an error, not as normal", () => {
  expect(getStatus({ ...base, temperature: 5, connection: "ok" })).toBe("error");
  expect(getStatus({ ...base, temperature: 5, connection: "ok", severity: "bogus" })).toBe("error");
  expect(getStatus({ ...base, temperature: 5, connection: "weird", severity: "normal" })).toBe("error");
});

test("a new shipment (temperature null) has no reading", () => {
  expect(hasReading({ ...base, temperature: null, connection: "loading" })).toBe(false);
  expect(hasReading({ ...base, temperature: 0, connection: "ok" })).toBe(true);
});

test("labels cover shipment status and alert response state", () => {
  expect(statusLabel("critical")).toBe("CRITICAL");
  expect(statusLabel("responded")).toBe("RESPONDED");
  expect(statusLabel("nope")).toBe("UNKNOWN");
});

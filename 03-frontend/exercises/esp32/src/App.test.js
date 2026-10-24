import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

// Data copied from the shapes in 02-domain-backend/docs/API_V1.md.
function makeBackend() {
  const state = {
    shipments: [
      {
        id: 1, name: "Vaccine Batch A", min: 2, max: 8, criticalMargin: 2,
        temperature: 9, history: [8, 9], connection: "ok", severity: "warning",
        lastReadingAt: "2026-10-19T10:00:01Z",
      },
      {
        id: 2, name: "New Shipment", min: 2, max: 8, criticalMargin: 2,
        temperature: null, history: [], connection: "loading", severity: "normal",
      },
    ],
    alerts: [
      {
        id: 1, shipmentId: 1, readingId: "device1:boot-a:1", severity: "warning",
        temperature: 9, time: "2026-10-19T10:00:01Z", responseStatus: "pending",
      },
    ],
  };

  const fetchMock = jest.fn(async (url, options = {}) => {
    const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
    if (url === "/api/shipments") return json(200, state.shipments);
    if (url === "/api/alerts") return json(200, state.alerts);
    if (url === "/api/shipments/1/responses" && options.method === "POST") {
      const body = JSON.parse(options.body);
      const response = { ...body, shipmentId: 1, recordedAt: "2026-10-19T10:01:00Z" };
      state.alerts = state.alerts.map((alert) =>
        alert.id === body.alertId ? { ...alert, responseStatus: "responded", response } : alert
      );
      return json(200, { shipmentId: 1, status: "responded", response });
    }
    return json(404, { error: "Route not found" });
  });
  return { state, fetchMock };
}

afterEach(() => {
  delete global.fetch;
});

test("shows the backend's severity and waits for data on a new shipment", async () => {
  const { fetchMock } = makeBackend();
  global.fetch = fetchMock;
  render(<App />);

  await screen.findByRole("heading", { name: "Vaccine Batch A", level: 3 });

  // Backend says warning for 9°C (max 8). The UI must not turn that into critical.
  expect(screen.getAllByText("WARNING").length).toBeGreaterThan(0);
  expect(screen.queryByText("CRITICAL")).not.toBeInTheDocument();
  // New shipment: temperature null + loading.
  expect(screen.getByText("Waiting for data...")).toBeInTheDocument();
  expect(screen.getByText("LOADING")).toBeInTheDocument();

  const urls = fetchMock.mock.calls.map(([url]) => url);
  expect(urls).toContain("/api/shipments");
  expect(urls).toContain("/api/alerts");
});

test("records a response with alertId/action/note and keeps the measured temperature", async () => {
  const { fetchMock } = makeBackend();
  global.fetch = fetchMock;
  const { container } = render(<App />);

  userEvent.click(await screen.findByRole("heading", { name: "Vaccine Batch A", level: 3 }));
  expect(container.querySelector("#detailTemp")).toHaveTextContent("9°C");

  userEvent.selectOptions(screen.getByLabelText("Action taken"), "contacted_driver");
  userEvent.type(screen.getByLabelText(/Note/), "Called the driver");
  userEvent.click(screen.getByRole("button", { name: "Record response" }));

  await screen.findByText("Response recorded for alert #1.");

  const post = fetchMock.mock.calls.find(([, options]) => options?.method === "POST");
  expect(post[0]).toBe("/api/shipments/1/responses");
  expect(JSON.parse(post[1].body)).toEqual({
    alertId: 1,
    action: "contacted_driver",
    note: "Called the driver",
  });

  // Responded is shown, but the real reading is not rewritten.
  await waitFor(() => expect(screen.getAllByText("RESPONDED").length).toBeGreaterThan(0));
  expect(container.querySelector("#detailTemp")).toHaveTextContent("9°C");
  expect(screen.getByText("WARNING", { selector: ".status-badge" })).toBeInTheDocument();
  expect(screen.getByText("No alerts waiting for a response.")).toBeInTheDocument();
});

test("shows an error when the backend cannot be reached", async () => {
  global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));
  render(<App />);

  expect(await screen.findByRole("alert")).toHaveTextContent(/Could not load shipments/);
});

import { useState, useEffect, useCallback } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Shipments from "./pages/Shipments";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import RightPanel from "./components/RightPanel";
import { getShipments } from "./services/shipmentService";
import useSensorSimulation from "./hooks/useSensorSimulation";
import useTheme from "./hooks/useTheme";
import { getStatus } from "./domain/status";
import { createAlertSubject } from "./domain/AlertObserver";

const OBSERVER_COUNT = 4;

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [shipments, setShipments] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error
  const [selectedId, setSelectedId] = useState(null);
  const [clock, setClock] = useState("");
  const [search, setSearch] = useState("");
  const [feedEntries, setFeedEntries] = useState([]);
  const { theme, toggleTheme } = useTheme();
  const [alertSubject] = useState(() => createAlertSubject());

  // Repository call: swap the inside of getShipments() for a real API later.
  useEffect(() => {
    let cancelled = false;
    getShipments()
      .then((result) => {
        if (cancelled) return;
        setShipments(result);
        setLoadState("ready");
      })
      .catch(() => !cancelled && setLoadState("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  // Observer: components subscribe to alertSubject instead of App pushing directly.
  useEffect(
    () =>
      alertSubject.subscribe((shipment) => {
        if (getStatus(shipment) === "normal") return;
        setFeedEntries((previous) =>
          [
            {
              name: shipment.name,
              status: getStatus(shipment),
              time: new Date().toLocaleTimeString(),
            },
            ...previous,
          ].slice(0, 8)
        );
      }),
    [alertSubject]
  );

  const notify = useCallback(
    (shipment) => alertSubject.notify(shipment),
    [alertSubject]
  );

  useSensorSimulation(setShipments, notify);

  useEffect(() => {
    const updateClock = () => setClock(new Date().toLocaleTimeString());
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedShipment =
    shipments.find((item) => item.id === selectedId) || null;
  const alertCount = shipments.filter((item) => getStatus(item) !== "normal").length;

  const resolveShipment = (shipment) => {
    const updated = {
      ...shipment,
      temperature: Number((shipment.min + 1).toFixed(1)),
      connection: "ok",
      history: [...shipment.history, Number((shipment.min + 1).toFixed(1))].slice(-6),
    };
    setShipments((previous) =>
      previous.map((item) => (item.id === shipment.id ? updated : item))
    );
    notify(updated);
  };

  const simulateConnection = (state) => {
    setShipments((previous) => {
      const target = previous.find((item) => item.id === 5);
      if (!target) return previous;
      const updated = { ...target, connection: state };
      queueMicrotask(() => notify(updated));
      return previous.map((item) => (item.id === 5 ? updated : item));
    });
  };

  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage} />
      <main className="main">
        <Header
          clock={clock}
          search={search}
          setSearch={setSearch}
          alertCount={alertCount}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        {loadState === "loading" && <p className="status-note">Loading shipments…</p>}
        {loadState === "error" && <p className="status-note">Could not load shipments.</p>}
        {loadState === "ready" && page === "Dashboard" && (
          <Dashboard
            shipments={shipments}
            selectedShipment={selectedShipment}
            setSelectedShipment={(item) => setSelectedId(item.id)}
            onResolve={resolveShipment}
            search={search}
          />
        )}
        {loadState === "ready" && page === "Shipments" && <Shipments shipments={shipments} />}
        {loadState === "ready" && page === "Alerts" && <Alerts shipments={shipments} />}
        {loadState === "ready" && page === "Reports" && <Reports shipments={shipments} />}
        {page === "Settings" && <Settings onSimulate={simulateConnection} />}
      </main>
      <RightPanel feedEntries={feedEntries} observerCount={OBSERVER_COUNT} />
    </div>
  );
}

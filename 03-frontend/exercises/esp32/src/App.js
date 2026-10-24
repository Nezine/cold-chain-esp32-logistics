import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Shipments from "./pages/Shipments";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import RightPanel from "./components/RightPanel";
import {
  USE_API,
  getShipments,
  getAlerts,
  respondToAlert,
  simulateConnection,
} from "./services/shipmentService";
import useSensorSimulation from "./hooks/useSensorSimulation";
import useTheme from "./hooks/useTheme";
import { createAlertSubject } from "./domain/AlertObserver";

const OBSERVER_COUNT = 4;
const POLL_INTERVAL_MS = 2000;
const FEED_LIMIT = 8;

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [shipments, setShipments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [clock, setClock] = useState("");
  const [search, setSearch] = useState("");
  const [feedEntries, setFeedEntries] = useState([]);
  const { theme, toggleTheme } = useTheme();
  const [alertSubject] = useState(() => createAlertSubject());
  const seenAlertIds = useRef(new Set());
  const refreshRef = useRef(null);

  // Mock sensor only exists in mock mode; never run it next to the real API.
  useSensorSimulation(!USE_API);

  // Observer: the feed subscribes and receives every alert that is new to the UI.
  useEffect(
    () =>
      alertSubject.subscribe((alert) =>
        setFeedEntries((previous) => [alert, ...previous].slice(0, FEED_LIMIT))
      ),
    [alertSubject]
  );

  // Alerts the UI has not seen before are announced through the subject
  // (oldest first, so the newest ends up on top of the feed).
  const applyAlerts = useCallback(
    (list) => {
      const seen = seenAlertIds.current;
      const fresh = list
        .filter((alert) => !seen.has(alert.id))
        .sort((a, b) => a.id - b.id);
      fresh.forEach((alert) => seen.add(alert.id));
      fresh.slice(-FEED_LIMIT).forEach((alert) => alertSubject.notify(alert));
      setAlerts(list);
    },
    [alertSubject]
  );

  // Load shipments + alerts now, then poll. Keeps polling after an error so the
  // page recovers by itself once the backend is up.
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let queued = false;

    const refresh = async ({ queue = false } = {}) => {
      if (inFlight) {
        if (queue) queued = true;
        return;
      }
      inFlight = true;
      try {
        const [shipmentList, alertList] = await Promise.all([getShipments(), getAlerts()]);
        if (cancelled) return;
        setShipments(shipmentList);
        applyAlerts(alertList);
        setLoadError("");
        setLoadState("ready");
      } catch (error) {
        if (cancelled) return;
        setLoadError(error.message || "Unknown error");
        setLoadState((state) => (state === "ready" ? state : "error"));
      } finally {
        inFlight = false;
        if (queued && !cancelled) {
          queued = false;
          refresh();
        }
      }
    };

    refreshRef.current = refresh;
    refresh();
    const timer = setInterval(() => refresh(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [applyAlerts]);

  useEffect(() => {
    const updateClock = () => setClock(new Date().toLocaleTimeString());
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedShipment =
    shipments.find((item) => item.id === selectedId) || null;
  const pendingAlertCount = alerts.filter(
    (alert) => alert.responseStatus === "pending"
  ).length;

  // Records what the dispatcher did for one alert. The measured temperature is
  // never changed here: the next real reading decides what the UI shows.
  const handleRespond = useCallback(async (shipmentId, payload) => {
    try {
      const result = await respondToAlert(shipmentId, payload);
      setAlerts((previous) =>
        previous.map((alert) =>
          alert.id === payload.alertId
            ? { ...alert, responseStatus: "responded", response: result?.response }
            : alert
        )
      );
      refreshRef.current?.({ queue: true });
      return result;
    } catch (error) {
      refreshRef.current?.({ queue: true }); // e.g. 409: someone already responded
      throw error;
    }
  }, []);

  const handleSimulate = (state) => {
    simulateConnection(state);
    refreshRef.current?.({ queue: true });
  };

  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage} />
      <main className="main">
        <Header
          clock={clock}
          search={search}
          setSearch={setSearch}
          alertCount={pendingAlertCount}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        {loadState === "loading" && <p className="status-note">Loading shipments…</p>}
        {loadState === "error" && (
          <p className="status-note status-note-error" role="alert">
            Could not load shipments: {loadError}
          </p>
        )}
        {loadState === "ready" && loadError && (
          <p className="status-note status-note-error" role="status">
            Connection lost, showing the last data. Retrying… ({loadError})
          </p>
        )}
        {loadState === "ready" && page === "Dashboard" && (
          <Dashboard
            shipments={shipments}
            alerts={alerts}
            selectedShipment={selectedShipment}
            setSelectedShipment={(item) => setSelectedId(item.id)}
            onRespond={handleRespond}
            search={search}
          />
        )}
        {loadState === "ready" && page === "Shipments" && <Shipments shipments={shipments} />}
        {loadState === "ready" && page === "Alerts" && (
          <Alerts shipments={shipments} alerts={alerts} />
        )}
        {loadState === "ready" && page === "Reports" && <Reports shipments={shipments} />}
        {page === "Settings" && <Settings apiMode={USE_API} onSimulate={handleSimulate} />}
      </main>
      <RightPanel
        feedEntries={feedEntries}
        shipments={shipments}
        alerts={alerts}
        observerCount={OBSERVER_COUNT}
      />
    </div>
  );
}

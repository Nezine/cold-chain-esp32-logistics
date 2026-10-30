import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Shipments from "./pages/Shipments";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import RightPanel from "./components/RightPanel";
import Operations from "./components/Operations";
import { getShipments, recordResponse } from "./services/shipmentService";
import useTheme from "./hooks/useTheme";
import { getStatus } from "./domain/status";
import { createAlertSubject } from "./domain/AlertObserver";

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [shipments, setShipments] = useState([]);
  const [loadState, setLoadState] = useState("loading");
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [clock, setClock] = useState("");
  const [search, setSearch] = useState("");
  const [feedEntries, setFeedEntries] = useState([]);
  const { theme, toggleTheme } = useTheme();
  const [subject] = useState(() => createAlertSubject());
  const previous = useRef(new Map());
  const mounted = useRef(false);
  const requestVersion = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    try {
      const result = await getShipments();
      if (!mounted.current || version !== requestVersion.current) return;
      result.forEach(item => {
        const signature = `${item.lastReadingAt}/${item.connection}/${item.severity}`;
        if (previous.current.get(item.id) !== signature) subject.notify(item);
        previous.current.set(item.id, signature);
      });
      setShipments(result);
      setLoadState("ready");
      setError("");
    } catch (err) {
      if (mounted.current && version === requestVersion.current) {
        setLoadState("error"); setError(err.message);
      }
    }
  }, [subject]);
  useEffect(() => subject.subscribe(item => {
    setFeedEntries(entries => [{ name: item.name, status: getStatus(item),
      time: new Date().toLocaleTimeString() }, ...entries].slice(0, 8));
  }), [subject]);
  useEffect(() => {
    mounted.current = true;
    refresh();
    const timer = setInterval(refresh, 2000);
    const clockTimer = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => { mounted.current = false; clearInterval(timer); clearInterval(clockTimer); };
  }, [refresh]);
  const resolveShipment = async (shipment, data) => {
    await recordResponse(shipment.id, data);
    await refresh();
  };
  const selectShipment = id => {
    setSelectedId(id);
    setSearch("");
  };
  const shipmentCreated = shipment => {
    // Use the POST result immediately; a background GET may still be in flight.
    ++requestVersion.current;
    setShipments(items => items.some(item => item.id === shipment.id) ? items : [...items, shipment]);
    selectShipment(shipment.id);
  };
  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage} />
      <main className="main">
        <Header clock={clock} search={search} setSearch={setSearch}
          alertCount={shipments.filter(s => getStatus(s) !== "normal").length}
          theme={theme} onToggleTheme={toggleTheme} />
        {loadState === "loading" && <p role="status">Đang tải chuyến hàng…</p>}
        {error && <p role="alert">Không thể tải dữ liệu: {error}. Hãy kiểm tra backend. <button onClick={refresh}>Thử lại</button></p>}
        {loadState === "ready" && <>
          {shipments.length === 0 && <p>Chưa có chuyến hàng. Tạo chuyến đầu tiên bên dưới.</p>}
          {(page === "Dashboard" || page === "Shipments" || page === "Settings") && <Operations shipments={shipments} onChange={refresh}
            selectedId={selectedId} onSelect={selectShipment} onCreated={shipmentCreated} />}
          {page === "Dashboard" && <Dashboard shipments={shipments}
            selectedShipment={shipments.find(s => s.id === selectedId) || shipments[0] || null}
            setSelectedShipment={s => selectShipment(s.id)} onResolve={resolveShipment} search={search} />}
          {page === "Shipments" && <Shipments shipments={shipments} />}
          {page === "Alerts" && <Alerts shipments={shipments} />}
          {page === "Reports" && <Reports shipments={shipments} />}
        </>}
      </main>
      <RightPanel feedEntries={feedEntries} observerCount={1} />
    </div>
  );
}

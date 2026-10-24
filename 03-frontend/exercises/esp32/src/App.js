import { useState, useEffect, useRef } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Shipments from './pages/Shipments';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import RightPanel from './components/RightPanel';
import ShipmentForm from './components/ShipmentForm';
import useLogistics from './hooks/useLogistics';
import useTheme from './hooks/useTheme';
import { createAlertSubject } from './domain/AlertObserver';

export default function App() {
  const [page, setPage] = useState('Dashboard');
  const [selectedId, setSelectedId] = useState(null);
  const [clock, setClock] = useState('');
  const [search, setSearch] = useState('');
  const [feedEntries, setFeedEntries] = useState([]);
  const { theme, toggleTheme } = useTheme();
  const { shipments, alerts, loaded, error, refresh, create, respond } = useLogistics();
  const [alertSubject] = useState(() => createAlertSubject());
  const seenAlerts = useRef(new Set());

  useEffect(() => alertSubject.subscribe((entry) => {
    setFeedEntries((previous) => [entry, ...previous].slice(0, 8));
  }), [alertSubject]);

  useEffect(() => {
    alerts.forEach((alert) => {
      if (seenAlerts.current.has(alert.id)) return;
      seenAlerts.current.add(alert.id);
      alertSubject.notify({
        name: shipments.find((item) => item.id === alert.shipmentId)?.name || `Shipment #${alert.shipmentId}`,
        status: alert.severity,
        time: new Date(alert.time).toLocaleTimeString(),
      });
    });
  }, [alerts, shipments, alertSubject]);

  useEffect(() => {
    const updateClock = () => setClock(new Date().toLocaleTimeString());
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const selectShipment = (shipment) => { setSelectedId(shipment.id); setPage('Dashboard'); };
  const createAndSelect = async (input) => {
    const shipment = await create(input);
    selectShipment(shipment);
  };
  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage} />
      <main className="main">
        <Header clock={clock} search={search} setSearch={setSearch}
          alertCount={alerts.filter((alert) => alert.responseStatus === 'pending').length}
          theme={theme} onToggleTheme={toggleTheme} />
        {!loaded && !error && <p className="status-note">Loading shipments…</p>}
        {error && <div className="status-note" role="alert">
          {loaded ? 'Connection lost. Showing last received data. ' : 'Could not load backend data. '}{error}
          <button onClick={refresh}>Retry connection</button>
        </div>}
        {loaded && page === 'Dashboard' && <>
          <ShipmentForm onCreate={createAndSelect} />
          <Dashboard shipments={shipments} alerts={alerts}
            selectedShipment={shipments.find((item) => item.id === selectedId) || null}
            setSelectedShipment={selectShipment} onRespond={respond} search={search} />
        </>}
        {loaded && page === 'Shipments' && <><ShipmentForm onCreate={createAndSelect} /><Shipments shipments={shipments} /></>}
        {loaded && page === 'Alerts' && <Alerts shipments={shipments} alerts={alerts} onSelect={selectShipment} />}
        {loaded && page === 'Reports' && <Reports shipments={shipments} />}
        {page === 'Settings' && <Settings />}
      </main>
      <RightPanel feedEntries={feedEntries} observerCount={1} />
    </div>
  );
}

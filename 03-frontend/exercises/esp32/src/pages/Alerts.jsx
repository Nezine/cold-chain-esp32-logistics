import AlertPanel from '../components/AlertPanel';
export default function Alerts({ shipments, alerts, onSelect }) {
  return <AlertPanel shipments={shipments} alerts={alerts} onSelect={onSelect} />;
}

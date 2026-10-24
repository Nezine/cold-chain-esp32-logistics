import AlertPanel from "../components/AlertPanel";

export default function Alerts({ shipments, alerts }) {
  return <AlertPanel alerts={alerts} shipments={shipments} title="Alerts" limit={50} />;
}

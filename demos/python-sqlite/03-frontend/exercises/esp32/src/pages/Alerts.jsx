import AlertPanel from "../components/AlertPanel";

export default function Alerts({ shipments }) {
  return <AlertPanel shipments={shipments} title="Active Alerts" />;
}

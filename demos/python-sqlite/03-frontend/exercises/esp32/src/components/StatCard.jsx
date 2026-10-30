export default function StatCard({ title, value, className = "", trend }) {
  return (
    <div className={`stat-card ${className}`.trim()}>
      <span>{title}</span>
      <h2>{value}</h2>
      {trend && <p className="trend">{trend}</p>}
    </div>
  );
}

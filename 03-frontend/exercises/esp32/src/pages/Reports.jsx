export default function Reports({ shipments }) {
  const readable = shipments.filter((item) => item.connection === "ok");
  const average =
    readable.reduce((sum, item) => sum + item.temperature, 0) /
    (readable.length || 1);

  return (
    <div className="panel">
      <h2>Reports</h2>
      <section className="stats" style={{ marginTop: 20 }}>
        <div className="stat-card">
          <span>Total shipments</span>
          <h2>{shipments.length}</h2>
        </div>
        <div className="stat-card">
          <span>Average temperature</span>
          <h2>{average.toFixed(1)}°C</h2>
        </div>
      </section>
    </div>
  );
}

export default function Settings({ onSimulate }) {
  return (
    <div className="panel">
      <h2>Settings</h2>
      <p>Mock sensor updates every 4 seconds.</p>
      <p>Dispatcher mode is on.</p>

      <h4 className="demo-title">Connection demo</h4>
      <div className="demo-actions">
        <button className="demo-btn" onClick={() => onSimulate("timeout")}>
          Simulate Timeout
        </button>
        <button className="demo-btn" onClick={() => onSimulate("error")}>
          Simulate Error
        </button>
        <button className="demo-btn demo-btn-primary" onClick={() => onSimulate("ok")}>
          Restore
        </button>
      </div>
      <p className="demo-hint">Applies to "Organ Transport Unit".</p>
    </div>
  );
}

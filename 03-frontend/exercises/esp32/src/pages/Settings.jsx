export default function Settings({ apiMode, onSimulate }) {
  return (
    <div className="panel">
      <h2>Settings</h2>
      {apiMode ? (
        <>
          <p>Live data from the backend API, refreshed every 2 seconds.</p>
          <p>Dispatcher mode is on.</p>
          <p className="demo-hint">
            The connection demo and the mock sensor are only available in mock mode
            (start the app with REACT_APP_USE_MOCK=true).
          </p>
        </>
      ) : (
        <>
          <p>Mock mode: in-memory data, sensor updates every 4 seconds.</p>
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
        </>
      )}
    </div>
  );
}

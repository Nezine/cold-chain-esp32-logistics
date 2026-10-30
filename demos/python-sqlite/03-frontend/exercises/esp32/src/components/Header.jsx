import ThemeToggle from "./ThemeToggle";

export default function Header({ clock, search, setSearch, alertCount, theme, onToggleTheme }) {
  return (
    <header className="topbar">
      <div>
        <h1>Hello, Dispatcher</h1>
        <p>Tracking cold shipments.</p>
      </div>

      <div className="topbar-right">
        <div className="search-box">
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search shipment..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="clock">{clock}</div>
        <ThemeToggle toggled={theme === "dark"} onClick={onToggleTheme} />
        <div className="bell">
          <svg viewBox="0 0 24 24">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          {alertCount > 0 && <span className="bell-badge">{alertCount}</span>}
        </div>
      </div>
    </header>
  );
}

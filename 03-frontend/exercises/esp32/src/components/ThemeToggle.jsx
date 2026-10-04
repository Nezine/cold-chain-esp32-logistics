// Hand-built sun/moon toggle, kept dependency-free on purpose: this project
// is Create React App + plain CSS (no Next.js "@/" aliases, no package
// registry access in this environment), so an external icon package could
// not be installed here. The prop shape below intentionally mirrors what
// a `toggled` / `onClick` controlled component looks like.
export default function ThemeToggle({ toggled, onClick, className = "" }) {
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={onClick}
      aria-pressed={toggled}
      aria-label={toggled ? "Switch to light mode" : "Switch to dark mode"}
      title={toggled ? "Switch to light mode" : "Switch to dark mode"}
    >
      <svg
        className="theme-toggle-icon"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <g className="theme-toggle-sun">
          <circle cx="12" cy="12" r="4.4" />
          <g className="theme-toggle-rays">
            <line x1="12" y1="1.6" x2="12" y2="4.1" />
            <line x1="12" y1="19.9" x2="12" y2="22.4" />
            <line x1="1.6" y1="12" x2="4.1" y2="12" />
            <line x1="19.9" y1="12" x2="22.4" y2="12" />
            <line x1="4.4" y1="4.4" x2="6.2" y2="6.2" />
            <line x1="17.8" y1="17.8" x2="19.6" y2="19.6" />
            <line x1="4.4" y1="19.6" x2="6.2" y2="17.8" />
            <line x1="17.8" y1="6.2" x2="19.6" y2="4.4" />
          </g>
        </g>
        <path
          className="theme-toggle-moon"
          d="M20.4 14.7A8.4 8.4 0 0 1 9.3 3.6a8.4 8.4 0 1 0 11.1 11.1Z"
        />
      </svg>
    </button>
  );
}

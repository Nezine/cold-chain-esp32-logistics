// Temperature as measured (no rounding or adjustment); "—" when there is none.
export function formatTemperature(value) {
  return typeof value === "number" ? `${value}°C` : "—";
}

// Backend times are UTC ISO strings (e.g. 2026-10-19T10:00:01Z).
export function formatTime(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? String(iso) : date.toLocaleTimeString();
}

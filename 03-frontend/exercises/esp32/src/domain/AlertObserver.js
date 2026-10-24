// Observer pattern: components subscribe, every new alert notifies them.
export function createAlertSubject() {
  const observers = new Set();
  return {
    subscribe(fn) {
      observers.add(fn);
      return () => observers.delete(fn);
    },
    notify(alert) {
      observers.forEach((fn) => fn(alert));
    },
  };
}

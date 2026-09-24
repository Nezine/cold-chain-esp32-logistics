// Observer pattern: components subscribe, shipment updates notify them.
export function createAlertSubject() {
  const observers = new Set();
  return {
    subscribe(fn) {
      observers.add(fn);
      return () => observers.delete(fn);
    },
    notify(shipment) {
      observers.forEach((fn) => fn(shipment));
    },
  };
}

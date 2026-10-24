import { useEffect } from "react";
import { tickMockSensor } from "../services/shipmentService";

// Mock ESP32 for demos without the backend (REACT_APP_USE_MOCK=true).
// Every 4s one connected shipment gets a new reading inside the mock backend.
// Disabled in API mode so a timer never overwrites real backend data.
export default function useSensorSimulation(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    const timer = setInterval(tickMockSensor, 4000);
    return () => clearInterval(timer);
  }, [enabled]);
}

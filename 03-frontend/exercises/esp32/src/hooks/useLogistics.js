import { useCallback, useEffect, useRef, useState } from 'react';
import { getShipments, getAlerts, createShipment, recordResponse } from '../services/shipmentService';

// Poll sequentially. New refreshes invalidate older in-flight snapshots so a
// mutation cannot be overwritten by a poll that started before it completed.
export default function useLogistics() {
  const [shipments, setShipments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(false);
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    try {
      const [nextShipments, nextAlerts] = await Promise.all([getShipments(), getAlerts()]);
      if (!mounted.current || current !== generation.current) return;
      setShipments(nextShipments);
      setAlerts(nextAlerts);
      setLoaded(true);
      setError('');
    } catch (failure) {
      if (mounted.current && current === generation.current) setError(failure.message);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let timer;
    let stopped = false;
    const poll = async () => {
      await refresh();
      if (!stopped) timer = setTimeout(poll, 2000);
    };
    poll();
    return () => {
      stopped = true;
      mounted.current = false;
      clearTimeout(timer);
    };
  }, [refresh]);

  const create = async (input) => {
    const shipment = await createShipment(input);
    await refresh();
    return shipment;
  };
  const respond = async (shipmentId, response) => {
    await recordResponse(shipmentId, response);
    await refresh();
  };
  return { shipments, alerts, loaded, error, refresh, create, respond };
}

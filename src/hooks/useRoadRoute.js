import { useState, useEffect, useRef } from 'react';
import { fetchRoadRoute } from '../utils/routing';

/**
 * Fetches road route from OSRM whenever markers change and routeMode is 'road'.
 * Automatically aborts stale requests.
 */
export function useRoadRoute(markers, routeMode) {
  const [roadRoute, setRoadRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (routeMode !== 'road' || markers.length < 2) {
      setRoadRoute(null);
      setError(null);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    fetchRoadRoute(markers, controller.signal)
      .then((route) => {
        if (!controller.signal.aborted) {
          setRoadRoute(route);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.name === 'AbortError' ? null : err.message);
          setRoadRoute(null);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [markers, routeMode]);

  return { roadRoute, roadRouteLoading: loading, roadRouteError: error };
}

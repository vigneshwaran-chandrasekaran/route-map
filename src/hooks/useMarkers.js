import { useState, useCallback } from 'react';

/**
 * Shared hook for managing map markers across all map implementations.
 */
export function useMarkers() {
  const [markers, setMarkers] = useState([]);

  const addMarker = useCallback((place) => {
    setMarkers((prev) => {
      // Avoid duplicate markers for the same place
      if (prev.some((m) => m.id === place.id)) return prev;
      return [...prev, place];
    });
  }, []);

  const removeMarker = useCallback((id) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const clearMarkers = useCallback(() => {
    setMarkers([]);
  }, []);

  return { markers, addMarker, removeMarker, clearMarkers };
}

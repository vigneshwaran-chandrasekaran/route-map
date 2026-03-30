import { useState, useCallback } from 'react';

/**
 * Shared hook for managing map markers across all map implementations.
 */
export function useMarkers() {
  const [markers, setMarkers] = useState([]);

  const addMarker = useCallback((place) => {
    setMarkers((prev) => {
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

  // Move a marker from one index to another
  const reorderMarkers = useCallback((fromIndex, toIndex) => {
    setMarkers((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  return { markers, setMarkers, addMarker, removeMarker, clearMarkers, reorderMarkers };
}

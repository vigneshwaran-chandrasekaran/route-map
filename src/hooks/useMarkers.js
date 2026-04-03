import { useState, useCallback } from 'react';
import { DEFAULT_ICON } from '../utils/markerIcons';

/**
 * Shared hook for managing map markers across all map implementations.
 */
export function useMarkers() {
  const [markers, setMarkers] = useState([]);

  const addMarker = useCallback((place) => {
    setMarkers((prev) => {
      if (prev.some((m) => m.id === place.id)) return prev;
      return [...prev, { ...place, icon: place.icon || DEFAULT_ICON }];
    });
  }, []);

  const removeMarker = useCallback((id) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const updateMarker = useCallback((id, updates) => {
    setMarkers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    );
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

  const reverseMarkers = useCallback(() => {
    setMarkers((prev) => [...prev].reverse());
  }, []);

  return { markers, setMarkers, addMarker, removeMarker, updateMarker, clearMarkers, reorderMarkers, reverseMarkers };
}

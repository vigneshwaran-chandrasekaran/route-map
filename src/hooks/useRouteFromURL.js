import { useEffect, useRef } from 'react';

/**
 * Parses a #route= hash from the URL and loads markers on mount.
 * Format: #route=lat,lng,name,icon;lat,lng,name,icon;...
 */
export function useRouteFromURL(setMarkers) {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const hash = window.location.hash;
    if (!hash.startsWith('#route=')) return;

    try {
      const data = hash.slice(7); // remove '#route='
      const parts = data.split(';').filter(Boolean);
      const markers = parts.map((part, i) => {
        const [lat, lng, name, icon] = part.split(',');
        return {
          id: Date.now() + i,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          name: decodeURIComponent(name || `Point ${i + 1}`),
          icon: icon || 'default',
        };
      }).filter((m) => !isNaN(m.lat) && !isNaN(m.lng));

      if (markers.length > 0) {
        setMarkers(markers);
        // Clean the hash after loading
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch {
      // Silently ignore malformed URLs
    }
  }, [setMarkers]);
}

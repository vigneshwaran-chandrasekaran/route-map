const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving/';

/**
 * Fetch road route from OSRM for an ordered list of markers.
 * Returns the full route geometry and distance/duration.
 */
export async function fetchRoadRoute(markers, signal) {
  if (markers.length < 2) return null;

  const coords = markers.map((m) => `${m.lng},${m.lat}`).join(';');
  const url = `${OSRM_BASE}${coords}?overview=full&geometries=geojson`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Routing failed: ${res.status}`);

  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error(data.message || 'No road route found');
  }

  const route = data.routes[0];
  return {
    coordinates: route.geometry.coordinates, // [[lng, lat], ...]
    distance: route.distance / 1000,         // km
    duration: route.duration,                 // seconds
  };
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

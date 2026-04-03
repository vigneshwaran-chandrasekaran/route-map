import api from '../api/axios';

// Default map center: Tamil Nadu, India (canonical source of truth)
export const DEFAULT_CENTER = { lat: 11.1271, lng: 78.6569 };
export const DEFAULT_ZOOM = 7;

// Haversine distance between two {lat, lng} points in km
export function haversineDistance(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Total route distance across ordered markers
export function getTotalDistance(markers) {
  let total = 0;
  for (let i = 1; i < markers.length; i++) {
    total += haversineDistance(markers[i - 1], markers[i]);
  }
  return total;
}

// Reverse-geocode coordinates via Nominatim, returns a marker-shaped object
export function reverseGeocode(lat, lng) {
  return api
    .get('https://nominatim.openstreetmap.org/reverse', {
      baseURL: '',
      params: { lat, lon: lng, format: 'json' },
      headers: { 'User-Agent': 'RouteMapApp/1.0' },
    })
    .then((res) => ({
      id: res.data.place_id || Date.now(),
      name: res.data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lat,
      lng,
    }))
    .catch(() => ({
      id: Date.now(),
      name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lat,
      lng,
    }));
}

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import PlaceSearch from '../components/PlaceSearch';
import MarkerList from '../components/MarkerList';
import { useMarkers } from '../hooks/useMarkers';
import './LeafletMap.css';

// Fix default marker icon issue with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Auto-fit map bounds when markers change
function FitBounds({ markers }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;

    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 13);
    } else {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, map]);

  return null;
}

function LeafletMap() {
  const { markers, addMarker, removeMarker, clearMarkers } = useMarkers();
  const mapRef = useRef(null);

  return (
    <div className="map-page">
      <div className="map-sidebar">
        <h2>Leaflet Map</h2>
        <p className="pkg-name">react-leaflet + leaflet</p>
        <PlaceSearch onSelect={addMarker} />
        <MarkerList
          markers={markers}
          onRemove={removeMarker}
          onClear={clearMarkers}
        />
      </div>
      <div className="map-container">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          className="map"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds markers={markers} />
          {markers.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lng]}>
              <Popup>{m.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default LeafletMap;

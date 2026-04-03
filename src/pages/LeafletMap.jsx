import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MapSidebar from '../components/MapSidebar';
import { useMapState } from '../hooks/useMapState';
import { reverseGeocode, DEFAULT_CENTER } from '../utils/geo';
import { getMarkerIcon } from '../utils/markerIcons';
import './LeafletMap.scss';

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

const LEAFLET_CENTER = [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];
const DEFAULT_ZOOM = 7;

// Free tile layer sources (no API key needed)
const TILE_LAYERS = {
  street: {
    name: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
  },
  topo: {
    name: 'Topographic',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
  dark: {
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
  light: {
    name: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
};

// Free overlay layers
const THUNDERFOREST_KEY = import.meta.env.VITE_THUNDERFOREST_API_KEY || '';

const OVERLAY_LAYERS = {
  ...(THUNDERFOREST_KEY && {
    transport: {
      name: 'Transport Lines',
      url: `https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=${THUNDERFOREST_KEY}`,
      attribution: '&copy; Thunderforest',
    },
  }),
  cycling: {
    name: 'Cycling Routes',
    url: 'https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://cycling.waymarkedtrails.org">Waymarked Trails</a>',
  },
  hiking: {
    name: 'Hiking Trails',
    url: 'https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://hiking.waymarkedtrails.org">Waymarked Trails</a>',
  },
};

// Marker icon (cached to avoid recreating on every render)
const iconCache = new Map();
function createMarkerIcon(iconKey, number) {
  const cacheKey = `${iconKey}-${number}`;
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey);
  const { emoji, color } = getMarkerIcon(iconKey);
  const icon = L.divIcon({
    className: 'numbered-marker',
    html: `<div class="marker-pin" style="--marker-color:${color}"><span class="marker-pin-emoji">${emoji}</span><span class="marker-pin-num">${number}</span></div>`,
    iconSize: [34, 46],
    iconAnchor: [17, 46],
    popupAnchor: [0, -40],
  });
  iconCache.set(cacheKey, icon);
  return icon;
}

// Fly to user location on load
function FlyToUserLocation({ location }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.setView([location.lat, location.lng], 13);
    }
  }, [location, map]);

  return null;
}

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

// Reverse geocode a map click and add marker
function MapClickHandler({ enabled, onAdd }) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      const { lat, lng } = e.latlng;
      reverseGeocode(lat, lng).then(onAdd);
    },
  });

  return null;
}

function LeafletMap() {
  const state = useMapState();
  const { markers, addMarker, clickToAdd, showRoute, userLocation } = state;

  const routePositions = useMemo(() => markers.map((m) => [m.lat, m.lng]), [markers]);

  return (
    <div className="map-page">
      <MapSidebar title="Leaflet Map" pkgName="react-leaflet + leaflet" state={state} />

      <div className={`map-container ${clickToAdd ? 'click-active' : ''}`}>
        <MapContainer center={LEAFLET_CENTER} zoom={DEFAULT_ZOOM} className="map">
          <LayersControl position="topright">
            {/* Base layers — only one active at a time */}
            {Object.entries(TILE_LAYERS).map(([key, layer]) => (
              <LayersControl.BaseLayer key={key} checked={key === 'street'} name={layer.name}>
                <TileLayer url={layer.url} attribution={layer.attribution} />
              </LayersControl.BaseLayer>
            ))}

            {/* Overlay layers — can toggle multiple */}
            {Object.entries(OVERLAY_LAYERS).map(([key, layer]) => (
              <LayersControl.Overlay key={key} name={layer.name}>
                <TileLayer url={layer.url} attribution={layer.attribution} opacity={0.7} />
              </LayersControl.Overlay>
            ))}
          </LayersControl>

          {markers.length === 0 && <FlyToUserLocation location={userLocation} />}
          <FitBounds markers={markers} />
          <MapClickHandler enabled={clickToAdd} onAdd={addMarker} />

          {/* Route polyline */}
          {showRoute && markers.length >= 2 && (
            <Polyline
              positions={routePositions}
              pathOptions={{
                color: '#646cff',
                weight: 3,
                opacity: 0.8,
                dashArray: '8 4',
              }}
            />
          )}

          {/* Markers */}
          {markers.map((m, i) => (
            <Marker
              key={m.id}
              position={[m.lat, m.lng]}
              icon={createMarkerIcon(m.icon, i + 1)}
            >
              <Popup>
                <div className="marker-popup">
                  <strong>{getMarkerIcon(m.icon).emoji} #{i + 1}</strong>
                  <p>{m.name}</p>
                  <small>
                    {m.lat.toFixed(4)}, {m.lng.toFixed(4)}
                  </small>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default LeafletMap;

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import PlaceSearch from '../components/PlaceSearch';
import MarkerList from '../components/MarkerList';
import { SaveGroup, SavedGroups } from '../components/SavedGroups';
import { useMarkers } from '../hooks/useMarkers';
import { useSavedGroups } from '../hooks/useSavedGroups';
import api from '../api/axios';
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

// Default center: Tamil Nadu, India
const DEFAULT_CENTER = [11.1271, 78.6569];
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
const OVERLAY_LAYERS = {
  transport: {
    name: 'Transport Lines',
    url: 'https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=6170aad10dfd42a38d4d8c709a536f38',
    attribution: '&copy; Thunderforest',
  },
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

// Numbered marker icon
function createNumberedIcon(number) {
  return L.divIcon({
    className: 'numbered-marker',
    html: `<div class="marker-pin"><span>${number}</span></div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -36],
  });
}

// Calculate distance between two lat/lng points in km (Haversine)
function haversineDistance(a, b) {
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

function getTotalDistance(markers) {
  let total = 0;
  for (let i = 1; i < markers.length; i++) {
    total += haversineDistance(markers[i - 1], markers[i]);
  }
  return total;
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

      api
        .get('https://nominatim.openstreetmap.org/reverse', {
          baseURL: '',
          params: { lat, lon: lng, format: 'json' },
          headers: { 'User-Agent': 'RouteMapApp/1.0' },
        })
        .then((res) => {
          const name = res.data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          onAdd({
            id: res.data.place_id || Date.now(),
            name,
            lat,
            lng,
          });
        })
        .catch(() => {
          // Fallback: add with coordinates as name
          onAdd({
            id: Date.now(),
            name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            lat,
            lng,
          });
        });
    },
  });

  return null;
}

function LeafletMap() {
  const { markers, setMarkers, addMarker, removeMarker, clearMarkers, reorderMarkers } = useMarkers();
  const { groups, saveGroup, updateGroup, deleteGroup } = useSavedGroups();
  const [showRoute, setShowRoute] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clickToAdd, setClickToAdd] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const totalDistance = getTotalDistance(markers);
  const routePositions = markers.map((m) => [m.lat, m.lng]);

  const handleSaveGroup = (name) => {
    saveGroup(name, markers);
  };

  const handleLoadGroup = (group) => {
    setMarkers(group.markers);
  };

  const handleEditGroup = (group) => {
    setMarkers(group.markers);
    setEditingGroup(group);
  };

  const handleUpdateGroup = (id, name) => {
    updateGroup(id, name, markers);
    setEditingGroup(null);
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
  };

  return (
    <div className="map-page">
      {/* Mobile sidebar toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <div className={`map-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Leaflet Map</h2>
          <p className="pkg-name">react-leaflet + leaflet</p>
        </div>

        <PlaceSearch onSelect={addMarker} />

        <div className="click-to-add">
          <label>
            <input
              type="checkbox"
              checked={clickToAdd}
              onChange={(e) => setClickToAdd(e.target.checked)}
            />
            Click on map to add marker
          </label>
        </div>

        {markers.length >= 2 && (
          <div className="route-info">
            <div className="route-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={showRoute}
                  onChange={(e) => setShowRoute(e.target.checked)}
                />
                Show route line
              </label>
            </div>
            <div className="route-stats">
              <span className="stat">
                <strong>{markers.length}</strong> stops
              </span>
              <span className="stat">
                <strong>{totalDistance.toFixed(1)}</strong> km
              </span>
            </div>
          </div>
        )}

        <MarkerList
          markers={markers}
          onRemove={removeMarker}
          onClear={clearMarkers}
          onReorder={reorderMarkers}
          numbered
        />

        <SaveGroup
          markers={markers}
          onSave={handleSaveGroup}
          editingGroup={editingGroup}
          onUpdate={handleUpdateGroup}
          onCancelEdit={handleCancelEdit}
        />
        <SavedGroups
          groups={groups}
          onLoad={handleLoadGroup}
          onDelete={deleteGroup}
          onEdit={handleEditGroup}
          editingGroupId={editingGroup?.id}
        />
      </div>

      <div className={`map-container ${clickToAdd ? 'click-active' : ''}`}>
        <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="map">
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

          {/* Numbered markers */}
          {markers.map((m, i) => (
            <Marker
              key={m.id}
              position={[m.lat, m.lng]}
              icon={createNumberedIcon(i + 1)}
            >
              <Popup>
                <div className="marker-popup">
                  <strong>#{i + 1}</strong>
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

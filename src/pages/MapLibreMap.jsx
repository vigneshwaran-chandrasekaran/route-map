import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Map, { Marker, Popup, Source, Layer, NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import PlaceSearch from '../components/PlaceSearch';
import MarkerList from '../components/MarkerList';
import { SaveGroup, SavedGroups } from '../components/SavedGroups';
import { useMarkers } from '../hooks/useMarkers';
import { useSavedGroups } from '../hooks/useSavedGroups';
import { useUserLocation } from '../hooks/useUserLocation';
import api from '../api/axios';
import './MapLibreMap.scss';

// Default center: Tamil Nadu, India
const DEFAULT_CENTER = { longitude: 78.6569, latitude: 11.1271 };
const DEFAULT_ZOOM = 6;

// Free map styles (no API key needed)
const MAP_STYLES = {
  street: {
    name: 'Street',
    url: 'https://tiles.openfreemap.org/styles/liberty',
  },
  bright: {
    name: 'Bright',
    url: 'https://tiles.openfreemap.org/styles/bright',
  },
  positron: {
    name: 'Light',
    url: 'https://tiles.openfreemap.org/styles/positron',
  },
  dark: {
    name: 'Dark',
    url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
};

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

function MapLibreMap() {
  const mapRef = useRef(null);
  const { markers, setMarkers, addMarker, removeMarker, clearMarkers, reorderMarkers } = useMarkers();
  const { groups, saveGroup, updateGroup, deleteGroup } = useSavedGroups();
  const { userLocation, locationError, locationLoading } = useUserLocation();
  const [showRoute, setShowRoute] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clickToAdd, setClickToAdd] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const [activeStyle, setActiveStyle] = useState('street');

  const totalDistance = useMemo(() => getTotalDistance(markers), [markers]);

  // GeoJSON for the route line
  const routeGeoJSON = useMemo(() => {
    if (markers.length < 2) return null;
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: markers.map((m) => [m.lng, m.lat]),
      },
    };
  }, [markers]);

  // Fly to user location on load
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation || markers.length > 0) return;
    map.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 13, duration: 800 });
  }, [userLocation, markers.length]);

  // Fit bounds when markers change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || markers.length === 0) return;

    if (markers.length === 1) {
      map.flyTo({ center: [markers[0].lng, markers[0].lat], zoom: 13, duration: 800 });
    } else {
      const lngs = markers.map((m) => m.lng);
      const lats = markers.map((m) => m.lat);
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 60, duration: 800 }
      );
    }
  }, [markers]);

  // Handle map click for adding markers
  const handleMapClick = useCallback(
    (e) => {
      if (!clickToAdd) return;
      const { lng, lat } = e.lngLat;

      api
        .get('https://nominatim.openstreetmap.org/reverse', {
          baseURL: '',
          params: { lat, lon: lng, format: 'json' },
          headers: { 'User-Agent': 'RouteMapApp/1.0' },
        })
        .then((res) => {
          const name = res.data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          addMarker({
            id: res.data.place_id || Date.now(),
            name,
            lat,
            lng,
          });
        })
        .catch(() => {
          addMarker({
            id: Date.now(),
            name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            lat,
            lng,
          });
        });
    },
    [clickToAdd, addMarker]
  );

  const handleSaveGroup = useCallback(
    (name) => {
      saveGroup(name, markers);
    },
    [saveGroup, markers]
  );

  const handleLoadGroup = useCallback(
    (group) => {
      setMarkers(group.markers);
    },
    [setMarkers]
  );

  const handleEditGroup = useCallback(
    (group) => {
      setMarkers(group.markers);
      setEditingGroup(group);
    },
    [setMarkers]
  );

  const handleUpdateGroup = useCallback(
    (id, name) => {
      updateGroup(id, name, markers);
      setEditingGroup(null);
    },
    [updateGroup, markers]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingGroup(null);
  }, []);

  const handleDeleteGroup = useCallback(
    (id) => {
      deleteGroup(id);
      setEditingGroup((prev) => (prev?.id === id ? null : prev));
    },
    [deleteGroup]
  );

  const handleClearMarkers = useCallback(() => {
    clearMarkers();
    setEditingGroup(null);
    setPopupInfo(null);
  }, [clearMarkers]);

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
          <h2>MapLibre Map</h2>
          <p className="pkg-name">react-map-gl + maplibre-gl</p>
        </div>

        {locationLoading && (
          <div className="location-status">Detecting your location…</div>
        )}
        {locationError && (
          <div className="location-status location-error">{locationError}</div>
        )}

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

        {/* Style switcher */}
        <div className="style-switcher">
          <label className="style-label">Map Style</label>
          <div className="style-options">
            {Object.entries(MAP_STYLES).map(([key, style]) => (
              <button
                key={key}
                className={`style-btn ${activeStyle === key ? 'active' : ''}`}
                onClick={() => setActiveStyle(key)}
              >
                {style.name}
              </button>
            ))}
          </div>
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
          onClear={handleClearMarkers}
          onReorder={reorderMarkers}
          numbered
        />

        <SaveGroup
          key={editingGroup?.id || 'new'}
          markers={markers}
          onSave={handleSaveGroup}
          editingGroup={editingGroup}
          onUpdate={handleUpdateGroup}
          onCancelEdit={handleCancelEdit}
        />
        <SavedGroups
          groups={groups}
          onLoad={handleLoadGroup}
          onDelete={handleDeleteGroup}
          onEdit={handleEditGroup}
          editingGroupId={editingGroup?.id}
        />
      </div>

      <div className={`map-container ${clickToAdd ? 'click-active' : ''}`}>
        <Map
          ref={mapRef}
          initialViewState={{
            ...DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
          }}
          mapStyle={MAP_STYLES[activeStyle].url}
          onClick={handleMapClick}
          cursor={clickToAdd ? 'crosshair' : undefined}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />
          <ScaleControl position="bottom-left" />

          {/* Route line */}
          {showRoute && routeGeoJSON && (
            <Source id="route" type="geojson" data={routeGeoJSON}>
              <Layer
                id="route-line"
                type="line"
                paint={{
                  'line-color': '#646cff',
                  'line-width': 3,
                  'line-opacity': 0.8,
                  'line-dasharray': [2, 1],
                }}
              />
            </Source>
          )}

          {/* Numbered markers */}
          {markers.map((m, i) => (
            <Marker
              key={m.id}
              longitude={m.lng}
              latitude={m.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setPopupInfo({ ...m, index: i });
              }}
            >
              <div className="maplibre-marker-pin">
                <span>{i + 1}</span>
              </div>
            </Marker>
          ))}

          {/* Popup */}
          {popupInfo && (
            <Popup
              longitude={popupInfo.lng}
              latitude={popupInfo.lat}
              anchor="bottom"
              offset={[0, -40]}
              onClose={() => setPopupInfo(null)}
              closeOnClick={false}
            >
              <div className="marker-popup">
                <strong>#{popupInfo.index + 1}</strong>
                <p>{popupInfo.name}</p>
                <small>
                  {popupInfo.lat.toFixed(4)}, {popupInfo.lng.toFixed(4)}
                </small>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}

export default MapLibreMap;

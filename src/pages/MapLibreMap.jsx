import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Map, { Marker, Popup, Source, Layer, NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapSidebar from '../components/MapSidebar';
import { useMapState } from '../hooks/useMapState';
import { reverseGeocode } from '../utils/geo';
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

function MapLibreMap() {
  const mapRef = useRef(null);
  const state = useMapState();
  const { markers, addMarker, clickToAdd, showRoute, userLocation, handleClearMarkers } = state;
  const [popupInfo, setPopupInfo] = useState(null);
  const [activeStyle, setActiveStyle] = useState('street');

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
      reverseGeocode(lat, lng).then(addMarker);
    },
    [clickToAdd, addMarker]
  );

  const handleClear = useCallback(() => {
    handleClearMarkers();
    setPopupInfo(null);
  }, [handleClearMarkers]);

  return (
    <div className="map-page">
      <MapSidebar
        title="MapLibre Map"
        pkgName="react-map-gl + maplibre-gl"
        state={state}
        onClearMarkers={handleClear}
      >
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
      </MapSidebar>

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

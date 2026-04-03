import { useEffect, useState, useCallback, useMemo } from 'react';
import { Map, Marker, Overlay, GeoJson, ZoomControl } from 'pigeon-maps';
import MapSidebar from '../components/MapSidebar';
import StyleSwitcher from '../components/StyleSwitcher';
import { useMapState } from '../hooks/useMapState';
import { reverseGeocode, DEFAULT_CENTER } from '../utils/geo';
import { getMarkerIcon } from '../utils/markerIcons';
import './PigeonMap.scss';

const INIT_CENTER = [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];
const INIT_ZOOM = 7;

// Free tile providers (no API key)
const TILE_PROVIDERS = {
  osm: {
    name: 'Street',
    provider: (x, y, z) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
  },
  topo: {
    name: 'Topographic',
    provider: (x, y, z) => `https://tile.opentopomap.org/${z}/${x}/${y}.png`,
  },
  dark: {
    name: 'Dark',
    provider: (x, y, z) => `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}@2x.png`,
  },
  light: {
    name: 'Light',
    provider: (x, y, z) => `https://a.basemaps.cartocdn.com/light_all/${z}/${x}/${y}@2x.png`,
  },
};

function PigeonMapPage() {
  const state = useMapState();
  const { markers, addMarker, clickToAdd, showRoute, routeMode, roadRoute, userLocation, handleClearMarkers } = state;
  const [activeStyle, setActiveStyle] = useState('osm');
  const [center, setCenter] = useState(INIT_CENTER);
  const [zoom, setZoom] = useState(INIT_ZOOM);
  const [popupData, setPopupData] = useState(null);

  // Fly to user location on load
  useEffect(() => {
    if (!userLocation || markers.length > 0) return;
    setCenter([userLocation.lat, userLocation.lng]);
    setZoom(13);
  }, [userLocation, markers.length]);

  // Fit bounds when markers change
  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      setCenter([markers[0].lat, markers[0].lng]);
      setZoom(13);
    } else {
      const lats = markers.map((m) => m.lat);
      const lngs = markers.map((m) => m.lng);
      const cLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const cLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      const dLat = Math.max(...lats) - Math.min(...lats);
      const dLng = Math.max(...lngs) - Math.min(...lngs);
      const maxSpan = Math.max(dLat, dLng);
      const fitZoom = maxSpan > 0 ? Math.min(14, Math.max(2, Math.floor(-Math.log2(maxSpan / 360) + 1))) : 13;
      setCenter([cLat, cLng]);
      setZoom(fitZoom);
    }
  }, [markers]);

  const handleMapClick = useCallback(
    ({ latLng }) => {
      if (!clickToAdd) return;
      const [lat, lng] = latLng;
      reverseGeocode(lat, lng).then(addMarker);
    },
    [clickToAdd, addMarker],
  );

  const handleClear = useCallback(() => {
    handleClearMarkers();
    setPopupData(null);
  }, [handleClearMarkers]);

  // Build GeoJSON for route line
  const routeGeoJson = useMemo(() => {
    if (!showRoute || markers.length < 2) return null;
    let coords;
    if (routeMode === 'road' && roadRoute?.coordinates?.length) {
      coords = roadRoute.coordinates; // already [lng, lat]
    } else {
      coords = markers.map((m) => [m.lng, m.lat]); // convert to GeoJSON order
    }
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: { dashed: routeMode !== 'road' || !roadRoute },
        },
      ],
    };
  }, [markers, showRoute, routeMode, roadRoute]);

  const isRoadRoute = routeMode === 'road' && roadRoute?.coordinates?.length;

  const routeStyle = useCallback(
    () => ({
      strokeWidth: '3',
      stroke: '#646cff',
      fill: 'none',
      strokeDasharray: isRoadRoute ? 'none' : '8 6',
      strokeLinecap: 'round',
    }),
    [isRoadRoute],
  );

  return (
    <div className="map-page">
      <MapSidebar
        title="Pigeon Maps"
        pkgName="pigeon-maps"
        state={state}
        onClearMarkers={handleClear}
      >
        <StyleSwitcher styles={TILE_PROVIDERS} activeStyle={activeStyle} onStyleChange={setActiveStyle} />
      </MapSidebar>

      <div className={`map-container ${clickToAdd ? 'click-active' : ''}`}>
        <Map
          center={center}
          zoom={zoom}
          onBoundsChanged={({ center: c, zoom: z }) => { setCenter(c); setZoom(z); }}
          onClick={handleMapClick}
          provider={TILE_PROVIDERS[activeStyle].provider}
          dprs={[1, 2]}
          attribution={false}
        >
          <ZoomControl />

          {/* Route line via GeoJson */}
          {routeGeoJson && (
            <GeoJson data={routeGeoJson} styleCallback={routeStyle} />
          )}

          {/* Markers */}
          {markers.map((m, i) => {
            const icon = getMarkerIcon(m.icon);
            return (
              <Marker
                key={m.id}
                anchor={[m.lat, m.lng]}
                onClick={() => setPopupData({ ...m, index: i })}
              >
                <div className="pigeon-marker-pin" style={{ '--marker-color': icon.color }}>
                  <span className="pigeon-marker-emoji">{icon.emoji}</span>
                  <span className="pigeon-marker-num">{i + 1}</span>
                </div>
              </Marker>
            );
          })}

          {/* Popup */}
          {popupData && (
            <Overlay anchor={[popupData.lat, popupData.lng]} offset={[0, -50]}>
              <div className="pigeon-popup">
                <button className="pigeon-popup-close" onClick={() => setPopupData(null)}>✕</button>
                <div className="marker-popup">
                  <strong>{getMarkerIcon(popupData.icon).emoji} #{popupData.index + 1}</strong>
                  <p>{popupData.name}</p>
                  <small>{popupData.lat.toFixed(4)}, {popupData.lng.toFixed(4)}</small>
                </div>
              </div>
            </Overlay>
          )}
        </Map>
      </div>
    </div>
  );
}

export default PigeonMapPage;

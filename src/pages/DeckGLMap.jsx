import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Map, NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import { DeckGL, ScatterplotLayer, PathLayer, TextLayer } from 'deck.gl';
import { PathStyleExtension } from '@deck.gl/extensions';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapSidebar from '../components/MapSidebar';
import StyleSwitcher from '../components/StyleSwitcher';
import { useMapState } from '../hooks/useMapState';
import { reverseGeocode, DEFAULT_CENTER } from '../utils/geo';
import { getMarkerIcon } from '../utils/markerIcons';
import './DeckGLMap.scss';

const INITIAL_VIEW = {
  longitude: DEFAULT_CENTER.lng,
  latitude: DEFAULT_CENTER.lat,
  zoom: 6,
  pitch: 0,
  bearing: 0,
};

const MAP_STYLES = {
  street: { name: 'Street', url: 'https://tiles.openfreemap.org/styles/liberty' },
  bright: { name: 'Bright', url: 'https://tiles.openfreemap.org/styles/bright' },
  positron: { name: 'Light', url: 'https://tiles.openfreemap.org/styles/positron' },
  dark: { name: 'Dark', url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' },
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function DeckGLMap() {
  const mapRef = useRef(null);
  const state = useMapState();
  const { markers, addMarker, clickToAdd, showRoute, routeMode, roadRoute, userLocation, handleClearMarkers } = state;
  const [activeStyle, setActiveStyle] = useState('street');
  const [viewState, setViewState] = useState(INITIAL_VIEW);
  const [popupData, setPopupData] = useState(null);

  // Fly to user location on load
  useEffect(() => {
    if (!userLocation || markers.length > 0) return;
    setViewState((v) => ({ ...v, longitude: userLocation.lng, latitude: userLocation.lat, zoom: 13 }));
  }, [userLocation, markers.length]);

  // Fit bounds when markers change
  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      setViewState((v) => ({ ...v, longitude: markers[0].lng, latitude: markers[0].lat, zoom: 13 }));
    } else {
      const lngs = markers.map((m) => m.lng);
      const lats = markers.map((m) => m.lat);
      const cLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      const cLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const dLng = Math.max(...lngs) - Math.min(...lngs);
      const dLat = Math.max(...lats) - Math.min(...lats);
      const maxSpan = Math.max(dLng, dLat);
      const zoom = maxSpan > 0 ? Math.min(14, Math.max(2, -Math.log2(maxSpan / 360) + 1)) : 13;
      setViewState((v) => ({ ...v, longitude: cLng, latitude: cLat, zoom }));
    }
  }, [markers]);

  const handleMapClick = useCallback(
    (info) => {
      if (!clickToAdd) return;
      if (info.coordinate) {
        const [lng, lat] = info.coordinate;
        reverseGeocode(lat, lng).then(addMarker);
      }
    },
    [clickToAdd, addMarker],
  );

  const handleClear = useCallback(() => {
    handleClearMarkers();
    setPopupData(null);
  }, [handleClearMarkers]);

  // Route path data
  const routePath = useMemo(() => {
    if (!showRoute || markers.length < 2) return [];
    let coords;
    if (routeMode === 'road' && roadRoute?.coordinates?.length) {
      coords = roadRoute.coordinates.map(([lng, lat]) => [lng, lat]);
    } else {
      coords = markers.map((m) => [m.lng, m.lat]);
    }
    return [{ path: coords }];
  }, [markers, showRoute, routeMode, roadRoute]);

  const isRoadRoute = routeMode === 'road' && roadRoute?.coordinates?.length > 0;

  const layers = [
    // Route line
    new PathLayer({
      id: 'route',
      data: routePath,
      getPath: (d) => d.path,
      getColor: [100, 108, 255],
      getWidth: isRoadRoute ? 4 : 3,
      widthUnits: 'pixels',
      getDashArray: isRoadRoute ? [0, 0] : [8, 4],
      dashJustified: true,
      extensions: [new PathStyleExtension({ dash: true })],
      visible: showRoute && markers.length >= 2,
    }),
    // Marker circles
    new ScatterplotLayer({
      id: 'markers',
      data: markers,
      getPosition: (d) => [d.lng, d.lat],
      getRadius: 14,
      getFillColor: (d) => hexToRgb(getMarkerIcon(d.icon).color),
      getLineColor: [255, 255, 255],
      getLineWidth: 2,
      lineWidthUnits: 'pixels',
      radiusUnits: 'pixels',
      pickable: true,
      onClick: (info) => {
        if (info.object) {
          setPopupData({
            ...info.object,
            index: markers.indexOf(info.object),
            x: info.x,
            y: info.y,
          });
        }
      },
    }),
    // Marker number labels
    new TextLayer({
      id: 'marker-labels',
      data: markers.map((m, i) => ({ ...m, label: String(i + 1) })),
      getPosition: (d) => [d.lng, d.lat],
      getText: (d) => d.label,
      getSize: 12,
      getColor: [255, 255, 255],
      fontWeight: 'bold',
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'center',
      fontFamily: 'system-ui, sans-serif',
    }),
  ];

  return (
    <div className="map-page">
      <MapSidebar
        title="Deck.gl Map"
        pkgName="deck.gl + maplibre-gl"
        state={state}
        onClearMarkers={handleClear}
      >
        <StyleSwitcher styles={MAP_STYLES} activeStyle={activeStyle} onStyleChange={setActiveStyle} />
      </MapSidebar>

      <div className={`map-container ${clickToAdd ? 'click-active' : ''}`}>
        <DeckGL
          viewState={viewState}
          onViewStateChange={({ viewState: vs }) => setViewState(vs)}
          controller
          layers={layers}
          onClick={handleMapClick}
          getCursor={({ isDragging }) => (clickToAdd ? 'crosshair' : isDragging ? 'grabbing' : 'grab')}
          style={{ width: '100%', height: '100%' }}
        >
          <Map
            ref={mapRef}
            mapStyle={MAP_STYLES[activeStyle].url}
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="top-right" />
            <ScaleControl position="bottom-left" />
          </Map>
        </DeckGL>

        {/* Popup */}
        {popupData && (
          <div
            className="deckgl-popup"
            style={{ left: popupData.x, top: popupData.y - 20 }}
          >
            <button className="deckgl-popup-close" onClick={() => setPopupData(null)}>✕</button>
            <div className="marker-popup">
              <strong>{getMarkerIcon(popupData.icon).emoji} #{popupData.index + 1}</strong>
              <p>{popupData.name}</p>
              <small>{popupData.lat.toFixed(4)}, {popupData.lng.toFixed(4)}</small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeckGLMap;

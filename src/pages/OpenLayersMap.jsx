import { useEffect, useRef, useState, useCallback } from 'react';
import OlMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Fill, Stroke, Text, Circle as CircleStyle } from 'ol/style';
import { defaults as defaultControls, ScaleLine } from 'ol/control';
import 'ol/ol.css';

import MapSidebar from '../components/MapSidebar';
import { useMapState } from '../hooks/useMapState';
import { reverseGeocode } from '../utils/geo';
import './OpenLayersMap.scss';

// Default center: Tamil Nadu, India
const DEFAULT_CENTER = fromLonLat([78.6569, 11.1271]);
const DEFAULT_ZOOM = 7;

// Free tile layer sources
const TILE_SOURCES = {
  street: {
    name: 'Street',
    create: () => new OSM(),
  },
  satellite: {
    name: 'Satellite',
    create: () =>
      new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: '&copy; Esri',
      }),
  },
  topo: {
    name: 'Topographic',
    create: () =>
      new XYZ({
        url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attributions: '&copy; OpenTopoMap',
      }),
  },
  dark: {
    name: 'Dark',
    create: () =>
      new XYZ({
        url: 'https://{a-d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attributions: '&copy; CARTO',
      }),
  },
  light: {
    name: 'Light',
    create: () =>
      new XYZ({
        url: 'https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attributions: '&copy; CARTO',
      }),
  },
};

// Create numbered marker style
function createMarkerStyle(number) {
  return new Style({
    image: new CircleStyle({
      radius: 14,
      fill: new Fill({ color: '#646cff' }),
      stroke: new Stroke({ color: '#fff', width: 2 }),
    }),
    text: new Text({
      text: String(number),
      fill: new Fill({ color: '#fff' }),
      font: 'bold 11px sans-serif',
      offsetY: 1,
    }),
  });
}

// Route line style
const routeLineStyle = new Style({
  stroke: new Stroke({
    color: '#646cff',
    width: 3,
    lineDash: [8, 4],
  }),
});

function OpenLayersMap() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerLayerRef = useRef(null);
  const routeLayerRef = useRef(null);

  const state = useMapState();
  const { markers, addMarker, clickToAdd, showRoute, userLocation, handleClearMarkers } = state;
  const [activeStyle, setActiveStyle] = useState('street');
  const [popupData, setPopupData] = useState(null);

  // Refs to access latest state in OL event handlers
  const clickToAddRef = useRef(clickToAdd);
  const addMarkerRef = useRef(addMarker);
  useEffect(() => { clickToAddRef.current = clickToAdd; }, [clickToAdd]);
  useEffect(() => { addMarkerRef.current = addMarker; }, [addMarker]);

  // Initialize OpenLayers map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const tileLayer = new TileLayer({ source: TILE_SOURCES.street.create() });
    const markerSource = new VectorSource();
    const markerLayer = new VectorLayer({ source: markerSource });
    const routeSource = new VectorSource();
    const routeLayer = new VectorLayer({ source: routeSource, style: routeLineStyle });

    tileLayerRef.current = tileLayer;
    markerLayerRef.current = markerLayer;
    routeLayerRef.current = routeLayer;

    const map = new OlMap({
      target: mapContainerRef.current,
      layers: [tileLayer, routeLayer, markerLayer],
      view: new View({
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
      }),
      controls: defaultControls().extend([new ScaleLine()]),
    });

    // Click handler for adding markers
    map.on('singleclick', (e) => {
      if (!clickToAddRef.current) return;
      const [lng, lat] = toLonLat(e.coordinate);
      reverseGeocode(lat, lng).then((place) => addMarkerRef.current(place));
    });

    // Pointer cursor on marker hover
    map.on('pointermove', (e) => {
      const hit = map.hasFeatureAtPixel(e.pixel, {
        layerFilter: (l) => l === markerLayer,
      });
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    // Click on marker to show popup
    map.on('singleclick', (e) => {
      const feature = map.forEachFeatureAtPixel(e.pixel, (f) => f, {
        layerFilter: (l) => l === markerLayer,
      });
      if (feature) {
        setPopupData({
          name: feature.get('markerName'),
          number: feature.get('markerNumber'),
          lat: feature.get('markerLat'),
          lng: feature.get('markerLng'),
          pixel: e.pixel,
        });
      } else if (!clickToAddRef.current) {
        setPopupData(null);
      }
    });

    mapRef.current = map;

    return () => {
      map.setTarget(null);
      mapRef.current = null;
    };
  }, []);

  // Fly to user location on load
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation || markers.length > 0) return;
    map.getView().animate({
      center: fromLonLat([userLocation.lng, userLocation.lat]),
      zoom: 13,
      duration: 800,
    });
  }, [userLocation, markers.length]);

  // Update cursor style when clickToAdd changes
  useEffect(() => {
    if (!mapRef.current) return;
    const el = mapRef.current.getTargetElement();
    if (el) {
      el.style.cursor = clickToAdd ? 'crosshair' : '';
    }
  }, [clickToAdd]);

  // Sync markers to OpenLayers vector layer
  useEffect(() => {
    const source = markerLayerRef.current?.getSource();
    if (!source) return;

    source.clear();
    markers.forEach((m, i) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([m.lng, m.lat])),
      });
      feature.set('markerName', m.name);
      feature.set('markerNumber', i + 1);
      feature.set('markerLat', m.lat);
      feature.set('markerLng', m.lng);
      feature.setStyle(createMarkerStyle(i + 1));
      source.addFeature(feature);
    });

    // Fit bounds
    const map = mapRef.current;
    if (!map || markers.length === 0) return;

    if (markers.length === 1) {
      map.getView().animate({
        center: fromLonLat([markers[0].lng, markers[0].lat]),
        zoom: 13,
        duration: 800,
      });
    } else {
      const extent = source.getExtent();
      map.getView().fit(extent, { padding: [60, 60, 60, 60], duration: 800 });
    }
  }, [markers]);

  // Sync route line
  useEffect(() => {
    const source = routeLayerRef.current?.getSource();
    if (!source) return;

    source.clear();
    if (showRoute && markers.length >= 2) {
      const coords = markers.map((m) => fromLonLat([m.lng, m.lat]));
      const feature = new Feature({ geometry: new LineString(coords) });
      source.addFeature(feature);
    }
  }, [markers, showRoute]);

  // Switch tile layer
  useEffect(() => {
    if (!tileLayerRef.current) return;
    tileLayerRef.current.setSource(TILE_SOURCES[activeStyle].create());
  }, [activeStyle]);

  // Close popup when markers change
  useEffect(() => {
    setPopupData(null);
  }, [markers]);

  const handleClear = useCallback(() => {
    handleClearMarkers();
    setPopupData(null);
  }, [handleClearMarkers]);

  return (
    <div className="map-page">
      <MapSidebar
        title="OpenLayers Map"
        pkgName="ol (OpenLayers)"
        state={state}
        onClearMarkers={handleClear}
      >
        {/* Style switcher */}
        <div className="style-switcher">
          <label className="style-label">Map Style</label>
          <div className="style-options">
            {Object.entries(TILE_SOURCES).map(([key, source]) => (
              <button
                key={key}
                className={`style-btn ${activeStyle === key ? 'active' : ''}`}
                onClick={() => setActiveStyle(key)}
              >
                {source.name}
              </button>
            ))}
          </div>
        </div>
      </MapSidebar>

      <div className={`map-container ${clickToAdd ? 'click-active' : ''}`}>
        <div ref={mapContainerRef} className="map ol-map" />

        {/* Custom popup overlay */}
        {popupData && (
          <div
            className="ol-popup"
            style={{
              left: popupData.pixel[0],
              top: popupData.pixel[1],
            }}
          >
            <button
              className="ol-popup-close"
              onClick={() => setPopupData(null)}
              aria-label="Close popup"
            >
              ✕
            </button>
            <div className="marker-popup">
              <strong>#{popupData.number}</strong>
              <p>{popupData.name}</p>
              <small>
                {popupData.lat.toFixed(4)}, {popupData.lng.toFixed(4)}
              </small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OpenLayersMap;

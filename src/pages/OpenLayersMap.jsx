import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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

import PlaceSearch from '../components/PlaceSearch';
import MarkerList from '../components/MarkerList';
import { SaveGroup, SavedGroups } from '../components/SavedGroups';
import { useMarkers } from '../hooks/useMarkers';
import { useSavedGroups } from '../hooks/useSavedGroups';
import api from '../api/axios';
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

// Haversine distance in km
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

  const { markers, setMarkers, addMarker, removeMarker, clearMarkers, reorderMarkers } = useMarkers();
  const { groups, saveGroup, updateGroup, deleteGroup } = useSavedGroups();
  const [showRoute, setShowRoute] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clickToAdd, setClickToAdd] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [activeStyle, setActiveStyle] = useState('street');
  const [popupData, setPopupData] = useState(null);

  const totalDistance = useMemo(() => getTotalDistance(markers), [markers]);

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

      api
        .get('https://nominatim.openstreetmap.org/reverse', {
          baseURL: '',
          params: { lat, lon: lng, format: 'json' },
          headers: { 'User-Agent': 'RouteMapApp/1.0' },
        })
        .then((res) => {
          const name = res.data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          addMarkerRef.current({
            id: res.data.place_id || Date.now(),
            name,
            lat,
            lng,
          });
        })
        .catch(() => {
          addMarkerRef.current({
            id: Date.now(),
            name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            lat,
            lng,
          });
        });
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

  const handleSaveGroup = useCallback(
    (name) => { saveGroup(name, markers); },
    [saveGroup, markers]
  );

  const handleLoadGroup = useCallback(
    (group) => { setMarkers(group.markers); },
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
    setPopupData(null);
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
          <h2>OpenLayers Map</h2>
          <p className="pkg-name">ol (OpenLayers)</p>
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

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as Cesium from 'cesium';
import MapSidebar from '../components/MapSidebar';
import StyleSwitcher from '../components/StyleSwitcher';
import { useMapState } from '../hooks/useMapState';
import { reverseGeocode, DEFAULT_CENTER } from '../utils/geo';
import { getMarkerIcon } from '../utils/markerIcons';
import './CesiumMap.scss';

// No Ion token needed – we use free OSM tiles
Cesium.Ion.defaultAccessToken = undefined;

// Imagery providers keyed for StyleSwitcher
const IMAGERY = {
  street: {
    name: 'Street',
    create: () => new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' }),
  },
  topo: {
    name: 'Topographic',
    create: () => new Cesium.UrlTemplateImageryProvider({ url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png' }),
  },
  dark: {
    name: 'Dark',
    create: () => new Cesium.UrlTemplateImageryProvider({ url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png' }),
  },
  light: {
    name: 'Light',
    create: () => new Cesium.UrlTemplateImageryProvider({ url: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png' }),
  },
};

function CesiumMapPage() {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const entitiesRef = useRef({ markers: [], route: null });

  const state = useMapState();
  const {
    markers, addMarker, clickToAdd, showRoute, routeMode, roadRoute,
    userLocation, handleClearMarkers,
  } = state;
  const [activeStyle, setActiveStyle] = useState('street');
  const [popupData, setPopupData] = useState(null);
  const [popupPos, setPopupPos] = useState(null);

  const clickToAddRef = useRef(clickToAdd);
  clickToAddRef.current = clickToAdd;
  const addMarkerRef = useRef(addMarker);
  addMarkerRef.current = addMarker;
  const markersRef = useRef(markers);
  markersRef.current = markers;

  // ── Initialise Cesium Viewer once ──
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const viewer = new Cesium.Viewer(containerRef.current, {
      baseLayer: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      timeline: false,
      animation: false,
      navigationHelpButton: false,
      sceneModePicker: false,
      infoBox: false,
      selectionIndicator: false,
    });
    viewer.imageryLayers.addImageryProvider(IMAGERY.street.create());
    viewerRef.current = viewer;

    // Initial camera position
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(DEFAULT_CENTER.lng, DEFAULT_CENTER.lat, 2000000),
      duration: 0,
    });

    // Left-click handler
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((event) => {
      const picked = viewer.scene.pick(event.position);

      // Entity picked → show popup
      if (Cesium.defined(picked) && picked.id && picked.id.id) {
        const entityId = picked.id.id;
        const curMarkers = markersRef.current;
        const idx = curMarkers.findIndex((m) => String(m.id) === String(entityId));
        if (idx >= 0) {
          const m = curMarkers[idx];
          const wc = Cesium.SceneTransforms.worldToWindowCoordinates(
            viewer.scene,
            Cesium.Cartesian3.fromDegrees(m.lng, m.lat, 0),
          );
          // Use functional setState to avoid stale closure
          setPopupData({ ...m, index: idx });
          if (wc) setPopupPos({ x: wc.x, y: wc.y });
        }
        return;
      }

      setPopupData(null);

      if (!clickToAddRef.current) return;
      const ray = viewer.camera.getPickRay(event.position);
      const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
      if (!cartesian) return;
      const carto = Cesium.Cartographic.fromCartesian(cartesian);
      reverseGeocode(
        Cesium.Math.toDegrees(carto.latitude),
        Cesium.Math.toDegrees(carto.longitude),
      ).then((place) => addMarkerRef.current(place));
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Switch imagery ──
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.imageryLayers.removeAll();
    viewer.imageryLayers.addImageryProvider(IMAGERY[activeStyle].create());
  }, [activeStyle]);

  // ── Fly to user location on load ──
  useEffect(() => {
    if (!userLocation || markers.length > 0) return;
    viewerRef.current?.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(userLocation.lng, userLocation.lat, 500000),
      duration: 1.5,
    });
  }, [userLocation, markers.length]);

  // ── Fit bounds when markers change ──
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || markers.length === 0) return;

    if (markers.length === 1) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(markers[0].lng, markers[0].lat, 50000),
        duration: 1,
      });
    } else {
      const lats = markers.map((m) => m.lat);
      const lngs = markers.map((m) => m.lng);
      const cLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const cLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      const span = Math.max(
        Math.max(...lats) - Math.min(...lats),
        Math.max(...lngs) - Math.min(...lngs),
      );
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(cLng, cLat, Math.max(span * 111000 * 1.5, 50000)),
        duration: 1,
      });
    }
  }, [markers]);

  // ── Sync marker entities ──
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Remove old marker entities
    entitiesRef.current.markers.forEach((e) => viewer.entities.remove(e));
    entitiesRef.current.markers = [];

    markers.forEach((m, i) => {
      const icon = getMarkerIcon(m.icon);
      const entity = viewer.entities.add({
        id: String(m.id),
        position: Cesium.Cartesian3.fromDegrees(m.lng, m.lat, 0),
        point: {
          pixelSize: 14,
          color: Cesium.Color.fromCssColorString(icon.color),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
        label: {
          text: `${icon.emoji} ${i + 1}`,
          font: '14px sans-serif',
          pixelOffset: new Cesium.Cartesian2(0, -24),
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        },
      });
      entitiesRef.current.markers.push(entity);
    });
  }, [markers]);

  // ── Sync route line ──
  const isRoadRoute = routeMode === 'road' && roadRoute?.coordinates?.length;
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Remove old route
    if (entitiesRef.current.route) {
      viewer.entities.remove(entitiesRef.current.route);
      entitiesRef.current.route = null;
    }

    if (!showRoute || markers.length < 2) return;

    let flat;
    if (isRoadRoute) {
      flat = roadRoute.coordinates.flat();
    } else {
      flat = markers.flatMap((m) => [m.lng, m.lat]);
    }

    const material = isRoadRoute
      ? Cesium.Color.fromCssColorString('#646cff')
      : new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.fromCssColorString('#646cff'),
          dashLength: 16,
        });

    entitiesRef.current.route = viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(flat),
        width: 4,
        material,
        clampToGround: true,
      },
    });
  }, [markers, showRoute, routeMode, roadRoute, isRoadRoute]);

  const handleClear = useCallback(() => {
    handleClearMarkers();
    setPopupData(null);
  }, [handleClearMarkers]);

  return (
    <div className="map-page">
      <MapSidebar
        title="CesiumJS"
        pkgName="cesium"
        state={state}
        onClearMarkers={handleClear}
      >
        <StyleSwitcher
          styles={IMAGERY}
          activeStyle={activeStyle}
          onStyleChange={setActiveStyle}
        />
      </MapSidebar>

      <div className="map-container cesium-map-wrapper">
        <div ref={containerRef} className="cesium-container" />

        {/* Custom popup */}
        {popupData && popupPos && (
          <div
            className="cesium-custom-popup"
            style={{ left: popupPos.x, top: popupPos.y }}
          >
            <button className="cesium-popup-close" onClick={() => setPopupData(null)}>
              ✕
            </button>
            <div className="marker-popup">
              <strong>
                {getMarkerIcon(popupData.icon).emoji} #{popupData.index + 1}
              </strong>
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

export default CesiumMapPage;

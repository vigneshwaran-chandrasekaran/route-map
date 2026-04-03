import { useState, useCallback, useMemo } from 'react';
import { useMarkers } from './useMarkers';
import { useSavedGroups } from './useSavedGroups';
import { useUserLocation } from './useUserLocation';
import { useRoadRoute } from './useRoadRoute';
import { getTotalDistance } from '../utils/geo';
import { DEFAULT_ICON } from '../utils/markerIcons';

/**
 * Shared state & callbacks used by every map page (Leaflet, MapLibre, OpenLayers).
 */
export function useMapState() {
  const { markers, setMarkers, addMarker, removeMarker, updateMarker, clearMarkers, reorderMarkers } = useMarkers();
  const { groups, saveGroup, updateGroup, deleteGroup } = useSavedGroups();
  const { userLocation, locationError, locationLoading } = useUserLocation();

  const [showRoute, setShowRoute] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clickToAdd, setClickToAdd] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState(DEFAULT_ICON);
  const [routeMode, setRouteMode] = useState('straight'); // 'straight' | 'road'

  const totalDistance = useMemo(() => getTotalDistance(markers), [markers]);
  const { roadRoute, roadRouteLoading, roadRouteError } = useRoadRoute(markers, routeMode);

  // Wrap addMarker to stamp the currently selected icon
  const addMarkerWithIcon = useCallback(
    (place) => addMarker({ ...place, icon: place.icon || selectedIcon }),
    [addMarker, selectedIcon],
  );

  const handleSaveGroup = useCallback(
    (name) => { saveGroup(name, markers); },
    [saveGroup, markers],
  );

  const handleLoadGroup = useCallback(
    (group) => { setMarkers(group.markers); },
    [setMarkers],
  );

  const handleEditGroup = useCallback(
    (group) => {
      setMarkers(group.markers);
      setEditingGroup(group);
    },
    [setMarkers],
  );

  const handleUpdateGroup = useCallback(
    (id, name) => {
      updateGroup(id, name, markers);
      setEditingGroup(null);
    },
    [updateGroup, markers],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingGroup(null);
  }, []);

  const handleDeleteGroup = useCallback(
    (id) => {
      deleteGroup(id);
      setEditingGroup((prev) => (prev?.id === id ? null : prev));
    },
    [deleteGroup],
  );

  const handleClearMarkers = useCallback(() => {
    clearMarkers();
    setEditingGroup(null);
  }, [clearMarkers]);

  return {
    // Markers
    markers, setMarkers, addMarker: addMarkerWithIcon, removeMarker, updateMarker, clearMarkers, reorderMarkers,
    // Groups
    groups,
    // User location
    userLocation, locationError, locationLoading,
    // UI state
    showRoute, setShowRoute,
    routeMode, setRouteMode,
    roadRoute, roadRouteLoading, roadRouteError,
    sidebarOpen, setSidebarOpen,
    clickToAdd, setClickToAdd,
    editingGroup, setEditingGroup,
    selectedIcon, setSelectedIcon,
    // Computed
    totalDistance,
    // Callbacks
    handleSaveGroup, handleLoadGroup, handleEditGroup, handleUpdateGroup,
    handleCancelEdit, handleDeleteGroup, handleClearMarkers,
  };
}

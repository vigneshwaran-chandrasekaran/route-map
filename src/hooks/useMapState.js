import { useState, useCallback, useMemo } from 'react';
import { useMarkers } from './useMarkers';
import { useSavedGroups } from './useSavedGroups';
import { useUserLocation } from './useUserLocation';
import { getTotalDistance } from '../utils/geo';

/**
 * Shared state & callbacks used by every map page (Leaflet, MapLibre, OpenLayers).
 */
export function useMapState() {
  const { markers, setMarkers, addMarker, removeMarker, clearMarkers, reorderMarkers } = useMarkers();
  const { groups, saveGroup, updateGroup, deleteGroup } = useSavedGroups();
  const { userLocation, locationError, locationLoading } = useUserLocation();

  const [showRoute, setShowRoute] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clickToAdd, setClickToAdd] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const totalDistance = useMemo(() => getTotalDistance(markers), [markers]);

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
    markers, setMarkers, addMarker, removeMarker, clearMarkers, reorderMarkers,
    // Groups
    groups,
    // User location
    userLocation, locationError, locationLoading,
    // UI state
    showRoute, setShowRoute,
    sidebarOpen, setSidebarOpen,
    clickToAdd, setClickToAdd,
    editingGroup, setEditingGroup,
    // Computed
    totalDistance,
    // Callbacks
    handleSaveGroup, handleLoadGroup, handleEditGroup, handleUpdateGroup,
    handleCancelEdit, handleDeleteGroup, handleClearMarkers,
  };
}

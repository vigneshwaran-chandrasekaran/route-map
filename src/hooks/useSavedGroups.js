import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'route-map-saved-groups';

function loadGroups() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function persistGroups(groups) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

/**
 * Hook for saving/loading named groups of markers to localStorage.
 */
export function useSavedGroups() {
  const [groups, setGroups] = useState(loadGroups);

  // Sync to localStorage whenever groups change
  useEffect(() => {
    persistGroups(groups);
  }, [groups]);

  const saveGroup = useCallback((name, markers) => {
    const group = {
      id: Date.now().toString(),
      name: name.trim(),
      markers,
      createdAt: new Date().toISOString(),
    };
    setGroups((prev) => [group, ...prev]);
    return group;
  }, []);

  const deleteGroup = useCallback((id) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const updateGroup = useCallback((id, name, markers) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, name: name.trim(), markers, updatedAt: new Date().toISOString() }
          : g
      )
    );
  }, []);

  const renameGroup = useCallback((id, newName) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, name: newName.trim() } : g))
    );
  }, []);

  return { groups, saveGroup, updateGroup, deleteGroup, renameGroup };
}

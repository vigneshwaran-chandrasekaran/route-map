import PlaceSearch from './PlaceSearch';
import MarkerList from './MarkerList';
import IconPicker from './IconPicker';
import ExportMenu from './ExportMenu';
import { SaveGroup, SavedGroups } from './SavedGroups';
import { formatDuration } from '../utils/routing';

/**
 * Shared sidebar used by every map page.
 *
 * @param {string}   title          – Map name shown in the header
 * @param {string}   pkgName        – Package label shown under the title
 * @param {object}   state          – The object returned by useMapState()
 * @param {Function} [onClearMarkers] – Override for the default handleClearMarkers (e.g. to also clear popup state)
 * @param {React.ReactNode} [children] – Extra controls inserted between "click-to-add" and route info (e.g. style switcher)
 */
function MapSidebar({ title, pkgName, state, onClearMarkers, children }) {
  const {
    locationLoading, locationError,
    markers, addMarker, removeMarker, updateMarker, reorderMarkers, reverseMarkers,
    showRoute, setShowRoute,
    routeMode, setRouteMode,
    roadRoute, roadRouteLoading, roadRouteError,
    sidebarOpen, setSidebarOpen,
    clickToAdd, setClickToAdd,
    selectedIcon, setSelectedIcon,
    totalDistance,
    editingGroup,
    groups,
    handleSaveGroup, handleUpdateGroup, handleCancelEdit,
    handleLoadGroup, handleDeleteGroup, handleEditGroup,
    handleClearMarkers,
  } = state;

  const clearFn = onClearMarkers || handleClearMarkers;

  return (
    <>
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
          <h2>{title}</h2>
          <p className="pkg-name">{pkgName}</p>
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

        <div className="new-marker-icon">
          <span className="new-marker-icon-label">New marker icon</span>
          <IconPicker value={selectedIcon} onChange={setSelectedIcon} />
        </div>

        {children}

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

            {showRoute && (
              <div className="route-mode">
                <button
                  className={`route-mode-btn ${routeMode === 'straight' ? 'active' : ''}`}
                  onClick={() => setRouteMode('straight')}
                >
                  ✦ Straight
                </button>
                <button
                  className={`route-mode-btn ${routeMode === 'road' ? 'active' : ''}`}
                  onClick={() => setRouteMode('road')}
                >
                  🛣 Road
                </button>
              </div>
            )}

            {roadRouteLoading && (
              <div className="route-loading">Loading road route…</div>
            )}
            {roadRouteError && (
              <div className="route-error">⚠ {roadRouteError}</div>
            )}

            <div className="route-stats">
              <span className="stat">
                <strong>{markers.length}</strong> stops
              </span>
              <span className="stat">
                <strong>{totalDistance.toFixed(1)}</strong> km straight
              </span>
              {roadRoute && (
                <>
                  <span className="stat">
                    <strong>{roadRoute.distance.toFixed(1)}</strong> km road
                  </span>
                  <span className="stat">
                    <strong>{formatDuration(roadRoute.duration)}</strong>
                  </span>
                </>
              )}
            </div>

            <ExportMenu markers={markers} roadRoute={roadRoute} />
          </div>
        )}

        <MarkerList
          markers={markers}
          onRemove={removeMarker}
          onClear={clearFn}
          onReorder={reorderMarkers}
          onReverse={reverseMarkers}
          onUpdateMarker={updateMarker}
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
    </>
  );
}

export default MapSidebar;

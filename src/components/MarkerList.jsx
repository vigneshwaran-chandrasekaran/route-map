import IconPicker from './IconPicker';
import { getMarkerIcon } from '../utils/markerIcons';
import { haversineDistance } from '../utils/geo';

function MarkerList({ markers, onRemove, onClear, onReorder, onReverse, onUpdateMarker, numbered }) {
  if (markers.length === 0) return null;

  return (
    <div className="marker-list">
      <div className="marker-list-header">
        <h3>Markers ({markers.length})</h3>
        <div className="marker-list-actions">
          {onReverse && markers.length >= 2 && (
            <button className="btn-reverse" onClick={onReverse} aria-label="Reverse route order" title="Reverse order">
              ⇅
            </button>
          )}
          <button className="btn-clear" onClick={onClear} aria-label="Clear all markers">
            Clear All
          </button>
        </div>
      </div>
      <ul>
        {markers.map((m, i) => (
          <li key={m.id}>
            {numbered && (
              <span className="marker-num" title={getMarkerIcon(m.icon).label}>
                {getMarkerIcon(m.icon).emoji}
              </span>
            )}
            <div className="marker-info">
              <span className="marker-name" title={m.name}>
                {m.name}
              </span>
              {i > 0 && (
                <span className="marker-leg-distance">
                  ↳ {haversineDistance(markers[i - 1], m).toFixed(1)} km from prev
                </span>
              )}
            </div>
            {onUpdateMarker && (
              <IconPicker
                value={m.icon}
                onChange={(icon) => onUpdateMarker(m.id, { icon })}
                compact
              />
            )}
            {onReorder && (
              <div className="reorder-btns">
                <button
                  className="btn-reorder"
                  onClick={() => onReorder(i, i - 1)}
                  disabled={i === 0}
                  aria-label={`Move ${m.name} up`}
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  className="btn-reorder"
                  onClick={() => onReorder(i, i + 1)}
                  disabled={i === markers.length - 1}
                  aria-label={`Move ${m.name} down`}
                  title="Move down"
                >
                  ▼
                </button>
              </div>
            )}
            <button className="btn-remove" onClick={() => onRemove(m.id)} aria-label={`Remove ${m.name}`}>
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MarkerList;

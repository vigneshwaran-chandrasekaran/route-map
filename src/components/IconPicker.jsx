import { useState, useRef, useEffect } from 'react';
import { MARKER_ICONS, getMarkerIcon } from '../utils/markerIcons';

/**
 * Dropdown grid for picking a marker icon.
 *
 * @param {string}   value     – current icon key
 * @param {Function} onChange  – called with new icon key
 * @param {boolean}  [compact] – smaller trigger for inline use (e.g. marker list)
 */
function IconPicker({ value, onChange, compact }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = getMarkerIcon(value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className={`icon-picker ${compact ? 'icon-picker--compact' : ''}`} ref={ref}>
      <button
        type="button"
        className="icon-picker-trigger"
        onClick={() => setOpen((v) => !v)}
        title={current.label}
        aria-label={`Icon: ${current.label}`}
      >
        <span className="icon-picker-emoji">{current.emoji}</span>
        {!compact && <span className="icon-picker-label">{current.label}</span>}
        <span className="icon-picker-caret">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="icon-picker-dropdown">
          {Object.entries(MARKER_ICONS).map(([key, icon]) => (
            <button
              key={key}
              type="button"
              className={`icon-picker-option ${value === key ? 'active' : ''}`}
              onClick={() => { onChange(key); setOpen(false); }}
              title={icon.label}
              aria-label={icon.label}
            >
              <span className="icon-picker-option-emoji">{icon.emoji}</span>
              <span className="icon-picker-option-label">{icon.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default IconPicker;

import { useState, useRef, useEffect } from 'react';
import { markersToGPX, markersToGeoJSON, downloadFile } from '../utils/exportRoute';

function ExportMenu({ markers, roadRoute }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (markers.length === 0) return null;

  const exportGPX = () => {
    downloadFile(markersToGPX(markers), 'route.gpx', 'application/gpx+xml');
    setOpen(false);
  };

  const exportGeoJSON = () => {
    downloadFile(
      markersToGeoJSON(markers, roadRoute?.coordinates),
      'route.geojson',
      'application/geo+json',
    );
    setOpen(false);
  };

  const copyLink = () => {
    const data = markers.map((m) => `${m.lat},${m.lng},${encodeURIComponent(m.name)},${m.icon || ''}`).join(';');
    const url = `${window.location.origin}${window.location.pathname}#route=${data}`;
    navigator.clipboard.writeText(url).then(() => {
      setOpen(false);
    });
  };

  return (
    <div className="export-menu" ref={ref}>
      <button className="export-menu-trigger" onClick={() => setOpen((v) => !v)} title="Export route">
        ⤓ Export
      </button>
      {open && (
        <div className="export-menu-dropdown">
          <button onClick={exportGPX}>📍 Download GPX</button>
          <button onClick={exportGeoJSON}>🗺 Download GeoJSON</button>
          <button onClick={copyLink}>🔗 Copy share link</button>
        </div>
      )}
    </div>
  );
}

export default ExportMenu;

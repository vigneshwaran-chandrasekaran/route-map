/**
 * Export markers & route in common formats.
 */

export function markersToGPX(markers, name = 'Route Map Export') {
  const wpts = markers.map((m, i) =>
    `  <wpt lat="${m.lat}" lon="${m.lng}">
    <name>${escapeXml(m.name)}</name>
    <desc>Stop ${i + 1}</desc>
  </wpt>`
  ).join('\n');

  const trkpts = markers.map((m) =>
    `      <trkpt lat="${m.lat}" lon="${m.lng}"><name>${escapeXml(m.name)}</name></trkpt>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RouteMap"
  xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${escapeXml(name)}</name></metadata>
${wpts}
  <trk>
    <name>${escapeXml(name)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

export function markersToGeoJSON(markers, roadCoords) {
  const features = markers.map((m, i) => ({
    type: 'Feature',
    properties: { name: m.name, stop: i + 1, icon: m.icon },
    geometry: { type: 'Point', coordinates: [m.lng, m.lat] },
  }));

  const lineCoords = roadCoords || markers.map((m) => [m.lng, m.lat]);
  if (lineCoords.length >= 2) {
    features.push({
      type: 'Feature',
      properties: { name: 'Route' },
      geometry: { type: 'LineString', coordinates: lineCoords },
    });
  }

  return JSON.stringify({ type: 'FeatureCollection', features }, null, 2);
}

function escapeXml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

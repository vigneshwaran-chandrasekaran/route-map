import { Link } from 'react-router-dom';

const maps = [
  { path: '/leaflet', name: 'Leaflet', pkg: 'react-leaflet + leaflet', ready: true },
  { path: '/maplibre', name: 'MapLibre GL', pkg: 'react-map-gl + maplibre-gl', ready: true },
  { path: '/openlayers', name: 'OpenLayers', pkg: 'ol', ready: false },
];

function Home() {
  return (
    <div className="page">
      <h1>Route Map</h1>
      <p>Multi-marker map app with place search — built with three open-source map libraries.</p>

      <h2>Available Maps</h2>
      <div className="map-cards">
        {maps.map((m) => (
          <div key={m.path} className={`map-card ${!m.ready ? 'disabled' : ''}`}>
            <h3>{m.name}</h3>
            <code>{m.pkg}</code>
            {m.ready ? (
              <Link to={m.path} className="btn">
                Open Map
              </Link>
            ) : (
              <span className="btn btn-disabled">Coming Soon</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;

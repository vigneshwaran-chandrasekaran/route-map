import { Link } from 'react-router-dom';

const maps = [
  { path: '/leaflet', name: 'Leaflet', pkg: 'react-leaflet + leaflet', ready: true },
  { path: '/maplibre', name: 'MapLibre GL', pkg: 'react-map-gl + maplibre-gl', ready: true },
  { path: '/openlayers', name: 'OpenLayers', pkg: 'ol', ready: true },
  { path: '/deckgl', name: 'Deck.gl', pkg: 'deck.gl + maplibre-gl', ready: true },
  { path: '/pigeon', name: 'Pigeon Maps', pkg: 'pigeon-maps', ready: true },
  { path: '/cesium', name: 'CesiumJS', pkg: 'cesium', ready: true },
];

const socials = [
  {
    name: 'GitHub',
    url: 'https://github.com/vigneshwaran-chandrasekaran',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/vigneshwaranc/',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77A1.75 1.75 0 0 0 0 1.73v20.54A1.75 1.75 0 0 0 1.77 24h20.45A1.76 1.76 0 0 0 24 22.27V1.73A1.76 1.76 0 0 0 22.22 0Z" />
      </svg>
    ),
  },
  {
    name: 'Hugging Face',
    url: 'https://huggingface.co/VigneshwaranC',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-2.5 8.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm5 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm2.3 3.4a5.5 5.5 0 0 1-9.6 0 .75.75 0 1 1 1.3-.74 4 4 0 0 0 7 0 .75.75 0 1 1 1.3.74Z" />
      </svg>
    ),
  },
];

function Home() {
  return (
    <div className="page">
      <h1>Route Map</h1>
      <p>Multi-marker map app with place search — built with six open-source map libraries.</p>

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

      <div className="social-links">
        {socials.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
            title={s.name}
          >
            {s.icon}
            <span>{s.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default Home;

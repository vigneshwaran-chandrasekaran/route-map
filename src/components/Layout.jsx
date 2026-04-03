import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

const MAP_ROUTES = ['/leaflet', '/maplibre', '/openlayers', '/deckgl', '/pigeon', '/cesium'];
const THEME_ICONS = { light: '☀️', dark: '🌙', system: '💻' };
const THEME_NEXT = { light: 'dark', dark: 'system', system: 'light' };

function Layout() {
  const { pathname } = useLocation();
  const isMapPage = MAP_ROUTES.some((r) => pathname.startsWith(r));
  const { theme, setTheme } = useTheme();

  return (
    <>
      <header>
        <nav>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/leaflet">Leaflet</NavLink>
          <NavLink to="/maplibre">MapLibre</NavLink>
          <NavLink to="/openlayers">OpenLayers</NavLink>
          <NavLink to="/deckgl">Deck.gl</NavLink>
          <NavLink to="/pigeon">Pigeon</NavLink>
          <NavLink to="/cesium">Cesium</NavLink>
          <NavLink to="/about">About</NavLink>
          <button
            className="theme-toggle"
            onClick={() => setTheme(THEME_NEXT[theme])}
            title={`Theme: ${theme}`}
            aria-label={`Switch theme (current: ${theme})`}
          >
            {THEME_ICONS[theme]}
          </button>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      {!isMapPage && (
        <footer>
          <p>&copy; {new Date().getFullYear()} Route Map</p>
        </footer>
      )}
    </>
  );
}

export default Layout;

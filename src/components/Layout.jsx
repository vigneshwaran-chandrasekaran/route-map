import { NavLink, Outlet, useLocation } from 'react-router-dom';

const MAP_ROUTES = ['/leaflet', '/maplibre', '/openlayers'];

function Layout() {
  const { pathname } = useLocation();
  const isMapPage = MAP_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <>
      <header>
        <nav>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/leaflet">Leaflet</NavLink>
          <NavLink to="/maplibre">MapLibre</NavLink>
          <NavLink to="/about">About</NavLink>
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

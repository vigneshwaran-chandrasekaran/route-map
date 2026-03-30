import { NavLink, Outlet } from 'react-router-dom';

function Layout() {
  return (
    <>
      <header>
        <nav>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <p>&copy; {new Date().getFullYear()} Route Map</p>
      </footer>
    </>
  );
}

export default Layout;

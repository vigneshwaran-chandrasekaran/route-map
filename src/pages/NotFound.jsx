import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="page not-found">
      <h1>404</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn">
        Go Home
      </Link>
    </div>
  );
}

export default NotFound;

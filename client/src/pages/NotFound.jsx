import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="notfound">
      <span className="notfound-code">404</span>
      <h1>Lost in hyperspace</h1>
      <p>The page you're looking for doesn't exist or was moved.</p>
      <div className="notfound-actions">
        <Link to="/" className="btn btn-primary">
          Back to Home
        </Link>
        <Link to="/shop" className="btn btn-ghost">
          Browse Store
        </Link>
      </div>
    </div>
  );
}

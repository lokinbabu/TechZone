import { Link } from 'react-router-dom';
import { Logo } from './Icons';
import { CATEGORY_ICONS } from '../utils/format';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" className="brand">
            <Logo size={34} />
            <span className="brand-name">
              Tech<span>Zone</span>
            </span>
          </Link>
          <p>
            A futuristic premium technology marketplace for gamers, creators and innovators.
            Verified gear. Fair prices. Fast delivery.
          </p>
        </div>

        <div className="footer-col">
          <h4>Shop</h4>
          <Link to="/shop">All Products</Link>
          <Link to="/shop?deals=1">Deals</Link>
          <Link to="/shop?sort=newest">New Arrivals</Link>
          <Link to="/shop?sort=rating">Top Rated</Link>
        </div>

        <div className="footer-col">
          <h4>Categories</h4>
          {['Laptops', 'Gaming', 'Audio', 'Monitors'].map((c) => (
            <Link key={c} to={`/shop?category=${encodeURIComponent(c)}`}>
              {CATEGORY_ICONS[c]} {c}
            </Link>
          ))}
        </div>

        <div className="footer-col">
          <h4>Account</h4>
          <Link to="/dashboard">My Dashboard</Link>
          <Link to="/orders">My Orders</Link>
          <Link to="/cart">My Cart</Link>
          <Link to="/login">Login / Register</Link>
        </div>

        <div className="footer-col">
          <h4>Support</h4>
          <a href="mailto:support@techzone.example">support@techzone.example</a>
          <span>Mon–Sat · 9:00–19:00 IST</span>
          <span>Cash on Delivery available</span>
          <span>7-day easy returns</span>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} TechZone. All rights reserved.</span>
        <span className="footer-tagline">Power your next level.</span>
      </div>
    </footer>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { CATEGORY_ICONS } from '../utils/format';
import {
  Logo,
  SearchIcon,
  CartIcon,
  UserIcon,
  MenuIcon,
  CloseIcon,
  ChevronDown,
  PackageIcon,
  DashboardIcon,
  LogoutIcon,
} from './Icons';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop' },
  { to: '/shop?deals=1', label: 'Deals' },
];

const CATEGORY_LINKS = [
  'Laptops',
  'Gaming',
  'Audio',
  'Keyboards',
  'Monitors',
  'Components',
  'Accessories',
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const navRef = useRef(null);

  // Close menus on navigation
  useEffect(() => {
    setMobileOpen(false);
    setCatOpen(false);
    setAcctOpen(false);
  }, [location.pathname, location.search]);

  // Close dropdowns on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setCatOpen(false);
        setAcctOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/shop?search=${encodeURIComponent(q)}` : '/shop');
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar-wrap" ref={navRef}>
      <nav className="navbar">
        <button
          className="icon-btn nav-burger"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
        </button>

        <Link to="/" className="brand" aria-label="TechZone home">
          <Logo size={32} />
          <span className="brand-name">
            Tech<span>Zone</span>
          </span>
        </Link>

        <ul className="nav-links">
          <li>
            <NavLink to="/" end>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/shop">Shop</NavLink>
          </li>
          <li className={`nav-dropdown ${catOpen ? 'open' : ''}`}>
            <button type="button" onClick={() => setCatOpen((o) => !o)}>
              Categories <ChevronDown size={14} />
            </button>
            {catOpen && (
              <div className="dropdown-panel categories-panel">
                {CATEGORY_LINKS.map((c) => (
                  <Link key={c} to={`/shop?category=${encodeURIComponent(c)}`} className="dropdown-item">
                    <span className="dd-icon">{CATEGORY_ICONS[c]}</span> {c}
                  </Link>
                ))}
                <Link to="/shop" className="dropdown-item dd-all">
                  <span className="dd-icon">✦</span> View all products
                </Link>
              </div>
            )}
          </li>
          <li>
            <NavLink to="/shop?deals=1">Deals</NavLink>
          </li>
        </ul>

        <form className="nav-search" onSubmit={submitSearch} role="search">
          <SearchIcon size={17} />
          <input
            type="search"
            placeholder="Search products, brands…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
          />
        </form>

        <div className="nav-actions">
          <Link to="/cart" className="icon-btn cart-btn" aria-label={`Cart (${count} items)`}>
            <CartIcon size={21} />
            {count > 0 && <span className="cart-badge">{count > 99 ? '99+' : count}</span>}
          </Link>

          {user ? (
            <div className={`nav-dropdown acct-dropdown ${acctOpen ? 'open' : ''}`}>
              <button type="button" className="acct-btn" onClick={() => setAcctOpen((o) => !o)}>
                <span className="acct-avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span className="acct-name">{user.name.split(' ')[0]}</span>
                <ChevronDown size={13} />
              </button>
              {acctOpen && (
                <div className="dropdown-panel acct-panel">
                  <div className="acct-header">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <Link to="/dashboard" className="dropdown-item">
                    <DashboardIcon size={16} /> Dashboard
                  </Link>
                  <Link to="/orders" className="dropdown-item">
                    <PackageIcon size={16} /> My Orders
                  </Link>
                  <Link to="/cart" className="dropdown-item">
                    <CartIcon size={16} /> Cart
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="dropdown-item admin-link">
                      <DashboardIcon size={16} /> Admin Panel
                    </Link>
                  )}
                  <button type="button" className="dropdown-item danger" onClick={handleLogout}>
                    <LogoutIcon size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm nav-login">
              <UserIcon size={16} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </nav>

      {mobileOpen && (
        <div className="mobile-menu">
          <form className="nav-search mobile-search" onSubmit={submitSearch} role="search">
            <SearchIcon size={17} />
            <input
              type="search"
              placeholder="Search products…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
            />
          </form>
          {NAV_LINKS.map((l) => (
            <NavLink key={l.label} to={l.to} end={l.end} className="mobile-link">
              {l.label}
            </NavLink>
          ))}
          <div className="mobile-section">Categories</div>
          <div className="mobile-cats">
            {CATEGORY_LINKS.map((c) => (
              <Link key={c} to={`/shop?category=${encodeURIComponent(c)}`} className="mobile-cat-chip">
                {CATEGORY_ICONS[c]} {c}
              </Link>
            ))}
          </div>
          <div className="mobile-section">Account</div>
          {user ? (
            <>
              <Link to="/dashboard" className="mobile-link">
                Dashboard
              </Link>
              <Link to="/orders" className="mobile-link">
                My Orders
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="mobile-link">
                  Admin Panel
                </Link>
              )}
              <button type="button" className="mobile-link danger" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-link">
                Login
              </Link>
              <Link to="/register" className="mobile-link">
                Create Account
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

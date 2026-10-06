import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Logo,
  DashboardIcon,
  BoxIcon,
  PlusIcon,
  PackageIcon,
  UsersIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
  HomeIcon,
} from '../../components/Icons';
import './admin.css';

const NAV = [
  { to: '/admin', end: true, label: 'Dashboard', icon: DashboardIcon },
  { to: '/admin/products', label: 'Products', icon: BoxIcon },
  { to: '/admin/products/new', label: 'Add Product', icon: PlusIcon },
  { to: '/admin/orders', label: 'Orders', icon: PackageIcon },
  { to: '/admin/customers', label: 'Customers', icon: UsersIcon },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => setSidebarOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-brand">
          <Logo size={30} />
          <div>
            <strong>TechZone</strong>
            <span>Command Center</span>
          </div>
        </div>

        <nav className="admin-nav">
          {NAV.map(({ to, end, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
          <div className="admin-nav-divider" />
          <NavLink to="/" end>
            <HomeIcon size={18} />
            <span>View Store</span>
          </NavLink>
          <button type="button" onClick={handleLogout} className="admin-logout">
            <LogoutIcon size={18} />
            <span>Logout</span>
          </button>
        </nav>

        <div className="admin-side-footer">
          <span className="acct-avatar lg">{user?.name?.charAt(0)?.toUpperCase()}</span>
          <div>
            <strong>{user?.name}</strong>
            <span>Administrator</span>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="admin-backdrop" onClick={() => setSidebarOpen(false)} />}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="icon-btn admin-burger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon size={22} />
          </button>
          <span className="admin-crumb">
            {location.pathname === '/admin'
              ? 'Dashboard'
              : location.pathname
                  .replace('/admin/', '')
                  .replace('/', ' / ')
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
          <span className="admin-topbar-right">
            <span className="admin-live-dot" /> Systems Online
          </span>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer close button */}
      {sidebarOpen && (
        <button
          type="button"
          className="icon-btn admin-drawer-close"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <CloseIcon size={22} />
        </button>
      )}
    </div>
  );
}

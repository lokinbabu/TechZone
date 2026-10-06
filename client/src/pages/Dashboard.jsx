import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice, formatDate, statusClass } from '../utils/format';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import ProductCard from '../components/ProductCard';
import Rating from '../components/Rating';
import { PackageIcon, BoltIcon, UserIcon } from '../components/Icons';
import './Dashboard.css';

const FALLBACK = '/images/products/fallback.svg';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { items, count, total } = useCart();
  const [orders, setOrders] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [o, r] = await Promise.all([api.getMyOrders(), api.getRecommended()]);
        if (cancelled) return;
        setOrders(o.orders || []);
        setRecommended(r.products || []);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size={44} label="Loading your dashboard…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        <EmptyState
          icon="⚠"
          title="Could not load dashboard"
          message={error.message}
          actionLabel="Try Again"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  const active = orders.filter((o) => !['Delivered', 'Cancelled'].includes(o.status));
  const delivered = orders.filter((o) => o.status === 'Delivered');
  const spent = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((s, o) => s + o.totalAmount, 0);

  return (
    <div className="container dashboard">
      <div className="dash-hero panel">
        <div className="dash-hero-user">
          <span className="dash-avatar">{user.name.charAt(0).toUpperCase()}</span>
          <div>
            <h1>Hello, {user.name.split(' ')[0]}</h1>
            <p>
              <UserIcon size={14} /> {user.email} · Member since {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
        <div className="dash-hero-actions">
          <Link to="/shop" className="btn btn-primary">
            Shop Now
          </Link>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="dash-stats">
        <div className="stat-card">
          <span className="stat-icon"><PackageIcon size={22} /></span>
          <div>
            <strong>{orders.length}</strong>
            <span>Total Orders</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon live"><BoltIcon size={22} /></span>
          <div>
            <strong>{active.length}</strong>
            <span>Active Orders</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon done">✓</span>
          <div>
            <strong>{delivered.length}</strong>
            <span>Delivered</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon spend">₹</span>
          <div>
            <strong>{formatPrice(spent)}</strong>
            <span>Total Spent</span>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="panel dash-orders">
          <div className="panel-head">
            <h2>Recent Orders</h2>
            {orders.length > 0 && <Link to="/orders" className="section-link">View all</Link>}
          </div>
          {orders.length === 0 ? (
            <EmptyState
              compact
              icon="📦"
              title="No orders yet"
              message="Your first order will show up here."
              actionLabel="Start Shopping"
              actionTo="/shop"
            />
          ) : (
            <div className="dash-order-list">
              {orders.slice(0, 4).map((o) => (
                <Link key={o._id} to={`/orders/${o._id}`} className="dash-order-row">
                  <div className="order-thumb sm">
                    <img
                      src={o.items[0]?.image || FALLBACK}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK;
                      }}
                    />
                  </div>
                  <div className="dash-order-info">
                    <strong>
                      #{o._id.slice(-8).toUpperCase()} · {o.items[0]?.name}
                      {o.items.length > 1 && ` +${o.items.length - 1}`}
                    </strong>
                    <span>{formatDate(o.createdAt)}</span>
                  </div>
                  <span className={`order-status ${statusClass(o.status)}`}>{o.status}</span>
                  <span className="dash-order-total">{formatPrice(o.totalAmount)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="panel dash-cart">
          <div className="panel-head">
            <h2>Cart Summary</h2>
            <Link to="/cart" className="section-link">Open cart</Link>
          </div>
          {items.length === 0 ? (
            <EmptyState
              compact
              icon="🛒"
              title="Cart is empty"
              message="Add gear to see it here."
              actionLabel="Browse Store"
              actionTo="/shop"
            />
          ) : (
            <>
              <p className="dash-cart-count">
                <strong>{count}</strong> item{count === 1 ? '' : 's'} ·{' '}
                <strong>{formatPrice(total)}</strong> estimated total
              </p>
              <div className="dash-cart-items">
                {items.slice(0, 4).map((i) => (
                  <div key={i._id} className="dash-cart-row">
                    <img
                      src={i.image || FALLBACK}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK;
                      }}
                    />
                    <span className="dash-cart-name">{i.name}</span>
                    <span className="dash-cart-qty">×{i.qty}</span>
                  </div>
                ))}
              </div>
              <Link to="/checkout" className="btn btn-primary btn-block">
                Checkout Now
              </Link>
            </>
          )}
        </div>
      </div>

      <section className="dash-recommended">
        <div className="section-head">
          <h2>Recommended For You</h2>
          <Link to="/shop" className="section-link">
            View all <span>→</span>
          </Link>
        </div>
        {recommended.length === 0 ? (
          <EmptyState compact icon="✦" title="No recommendations yet" />
        ) : (
          <div className="product-grid grid-4">
            {recommended.slice(0, 4).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

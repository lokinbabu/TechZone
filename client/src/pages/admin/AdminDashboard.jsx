import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { formatPrice, formatDate, statusClass } from '../../utils/format';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import {
  BoxIcon,
  UsersIcon,
  PackageIcon,
  BoltIcon,
  ChevronRight,
} from '../../components/Icons';
import './admin.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getProducts({ limit: 1 }), api.getAllOrders(), api.getCustomers()])
      .then(([p, o, c]) => {
        if (cancelled) return;
        const orders = o.orders || [];
        const pending = orders.filter((x) => ['Placed', 'Processing'].includes(x.status)).length;
        const sales = orders
          .filter((x) => x.status !== 'Cancelled')
          .reduce((s, x) => s + x.totalAmount, 0);
        setStats({
          products: p.pagination?.total ?? 0,
          customers: (c.customers || []).length,
          orders: orders.length,
          sales,
          pending,
        });
        setRecent(orders.slice(0, 6));
      })
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size={44} label="Booting command center…" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠"
        title="Failed to load dashboard"
        message={error.message}
        actionLabel="Retry"
        onAction={() => window.location.reload()}
      />
    );
  }

  const cards = [
    { label: 'Total Products', value: stats.products, icon: <BoxIcon size={22} />, to: '/admin/products' },
    { label: 'Total Customers', value: stats.customers, icon: <UsersIcon size={22} />, to: '/admin/customers' },
    { label: 'Total Orders', value: stats.orders, icon: <PackageIcon size={22} />, to: '/admin/orders' },
    { label: 'Total Sales', value: formatPrice(stats.sales), icon: <BoltIcon size={22} /> },
    { label: 'Pending Orders', value: stats.pending, icon: <BoltIcon size={22} />, to: '/admin/orders', accent: true },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Command Center</h1>
          <p>Live overview of the TechZone marketplace.</p>
        </div>
        <Link to="/admin/products/new" className="btn btn-primary btn-sm">
          + Add Product
        </Link>
      </div>

      <div className="admin-stats">
        {cards.map((c) => (
          <Link key={c.label} to={c.to || '#'} className={`admin-stat-card ${c.accent ? 'accent' : ''}`}>
            <span className="admin-stat-icon">{c.icon}</span>
            <div>
              <strong>{c.value}</strong>
              <span>{c.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Recent Orders</h2>
          <Link to="/admin/orders" className="section-link">
            Manage orders <ChevronRight size={14} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState compact icon="📦" title="No orders yet" message="Orders will appear here as customers check out." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o._id}>
                    <td className="mono">#{o._id.slice(-8).toUpperCase()}</td>
                    <td>{o.user?.name || '—'}</td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td>{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                    <td>{formatPrice(o.totalAmount)}</td>
                    <td>
                      <span className={`order-status sm ${statusClass(o.status)}`}>{o.status}</span>
                    </td>
                    <td>
                      <Link to={`/admin/orders/${o._id}`} className="link-btn">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

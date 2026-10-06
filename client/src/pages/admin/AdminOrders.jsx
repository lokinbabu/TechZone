import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { formatPrice, formatDate, statusClass } from '../../utils/format';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { SearchIcon } from '../../components/Icons';
import './admin.css';

const STATUSES = ['All', 'Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getAllOrders()
      .then((d) => !cancelled && setOrders(d.orders || []))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = status === 'All' ? orders : orders.filter((o) => o.status === status);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o._id.toLowerCase().includes(q) ||
          o.user?.name?.toLowerCase().includes(q) ||
          o.user?.email?.toLowerCase().includes(q) ||
          o.customer?.fullName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, status, search]);

  const counts = useMemo(() => {
    const c = { All: orders.length };
    for (const s of STATUSES.slice(1)) c[s] = orders.filter((o) => o.status === s).length;
    return c;
  }, [orders]);

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size={44} label="Loading orders…" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠"
        title="Failed to load orders"
        message={error.message}
        actionLabel="Retry"
        onAction={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Orders</h1>
          <p>{orders.length} orders across all customers</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="status-tabs">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`chip ${status === s ? 'active' : ''}`}
              onClick={() => setStatus(s)}
            >
              {s} <span className="chip-count">{counts[s] || 0}</span>
            </button>
          ))}
        </div>
        <div className="admin-search">
          <SearchIcon size={16} />
          <input
            type="search"
            placeholder="Search by order ID or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No orders found"
          message={orders.length === 0 ? 'Orders will appear here as customers check out.' : 'Try a different filter or search.'}
        />
      ) : (
        <div className="panel admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o._id}>
                  <td className="mono">#{o._id.slice(-8).toUpperCase()}</td>
                  <td>
                    <div className="admin-cust-cell">
                      <strong>{o.customer?.fullName || o.user?.name || '—'}</strong>
                      <span>{o.user?.email || '—'}</span>
                    </div>
                  </td>
                  <td>{formatDate(o.createdAt)}</td>
                  <td>{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                  <td>{formatPrice(o.totalAmount)}</td>
                  <td>
                    <span className="pill pill-dim">COD</span>
                  </td>
                  <td>
                    <span className={`order-status sm ${statusClass(o.status)}`}>{o.status}</span>
                  </td>
                  <td>
                    <Link to={`/admin/orders/${o._id}`} className="link-btn">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useMemo } from 'react';
import api from '../../api/client';
import { formatDate, formatPrice } from '../../utils/format';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { SearchIcon } from '../../components/Icons';
import './admin.css';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .getCustomers()
      .then((d) => !cancelled && setCustomers(d.customers || []))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [customers, search]);

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size={44} label="Loading customers…" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠"
        title="Failed to load customers"
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
          <h1>Customers</h1>
          <p>{customers.length} registered customer{customers.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <SearchIcon size={16} />
          <input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No customers found"
          message={customers.length === 0 ? 'Customer accounts will appear here as people register.' : 'Try a different search.'}
        />
      ) : (
        <div className="panel admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Registered</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Last Order</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id}>
                  <td>
                    <div className="admin-cust-cell">
                      <span className="acct-avatar sm">{c.name.charAt(0).toUpperCase()}</span>
                      <strong>{c.name}</strong>
                    </div>
                  </td>
                  <td>{c.email}</td>
                  <td>{formatDate(c.createdAt)}</td>
                  <td>
                    <span className={`pill ${c.orderCount > 0 ? 'pill-cyan' : 'pill-dim'}`}>
                      {c.orderCount}
                    </span>
                  </td>
                  <td>{formatPrice(c.totalSpent)}</td>
                  <td>{c.lastOrderAt ? formatDate(c.lastOrderAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { formatPrice, formatDate, statusClass } from '../utils/format';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { ChevronRight, PackageIcon } from '../components/Icons';
import './Orders.css';

const FALLBACK = '/images/products/fallback.svg';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getMyOrders()
      .then((d) => !cancelled && setOrders(d.orders || []))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size={44} label="Loading your orders…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        <EmptyState
          icon="⚠"
          title="Could not load orders"
          message={error.message}
          actionLabel="Try Again"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="container orders-page">
      <div className="page-head">
        <h1>My Orders</h1>
        {orders.length > 0 && (
          <span className="count-pill">{orders.length} total</span>
        )}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No orders yet"
          message="When you place an order it will appear here with live status tracking."
          actionLabel="Start Shopping"
          actionTo="/shop"
        />
      ) : (
        <div className="orders-list">
          {orders.map((o) => (
            <Link key={o._id} to={`/orders/${o._id}`} className="order-card">
              <div className="order-card-top">
                <div className="order-card-id">
                  <span className="order-id-label">Order</span>
                  <span className="mono">#{o._id.slice(-8).toUpperCase()}</span>
                </div>
                <span className={`order-status ${statusClass(o.status)}`}>{o.status}</span>
              </div>

              <div className="order-card-items">
                {o.items.slice(0, 3).map((i, idx) => (
                  <div key={`${i.product}-${idx}`} className="order-thumb">
                    <img
                      src={i.image || FALLBACK}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK;
                      }}
                    />
                    <span className="order-thumb-qty">×{i.qty}</span>
                  </div>
                ))}
                {o.items.length > 3 && <span className="order-more">+{o.items.length - 3}</span>}
                <div className="order-card-summary">
                  <strong>
                    {o.items[0].name}
                    {o.items.length > 1 && ` + ${o.items.length - 1} more`}
                  </strong>
                  <span>
                    {formatDate(o.createdAt)} · {o.paymentMethod}
                  </span>
                </div>
              </div>

              <div className="order-card-bottom">
                <span className="order-card-total">{formatPrice(o.totalAmount)}</span>
                <span className="order-card-view">
                  Details <ChevronRight size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

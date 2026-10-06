import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { formatPrice, formatDate, statusClass } from '../../utils/format';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { TruckIcon, BoltIcon, UserIcon } from '../../components/Icons';
import './admin.css';

const FALLBACK = '/images/products/fallback.svg';
const STATUSES = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrderDetails() {
  const { id } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextStatus, setNextStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getOrder(id)
      .then((d) => {
        if (cancelled) return;
        setOrder(d.order);
        setNextStatus(d.order.status);
      })
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size={44} label="Loading order…" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <EmptyState
        icon="⚠"
        title="Order not found"
        message="It may have been removed."
        actionLabel="Back to Orders"
        actionTo="/admin/orders"
      />
    );
  }

  const changeStatus = async () => {
    if (!nextStatus || nextStatus === order.status) return;
    setSaving(true);
    try {
      const d = await api.updateOrderStatus(order._id, nextStatus);
      setOrder(d.order);
      toast.success(`Status updated to "${nextStatus}"`);
    } catch (err) {
      toast.error(err.message || 'Could not update status');
      setNextStatus(order.status);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>
            Order <span className="mono"># {order._id.slice(-8).toUpperCase()}</span>
          </h1>
          <p>Placed {formatDate(order.createdAt, true)}</p>
        </div>
        <span className={`order-status lg ${statusClass(order.status)}`}>{order.status}</span>
      </div>

      <div className="admin-order-grid">
        <div className="panel">
          <div className="panel-head">
            <h2>Items ({order.items.length})</h2>
          </div>
          <div className="co-items">
            {order.items.map((i, idx) => (
              <div key={`${i.product}-${idx}`} className="co-item">
                <img
                  src={i.image || FALLBACK}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK;
                  }}
                />
                <div className="co-item-info">
                  <span className="co-item-name">{i.name}</span>
                  <span className="co-item-meta">
                    {i.brand} · {i.qty} × {formatPrice(i.price)}
                  </span>
                </div>
                <span className="co-item-total">{formatPrice(i.price * i.qty)}</span>
              </div>
            ))}
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(order.itemsPrice)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span className={order.deliveryCharge === 0 ? 'free' : ''}>
              {order.deliveryCharge === 0 ? 'FREE' : formatPrice(order.deliveryCharge)}
            </span>
          </div>
          <div className="summary-row summary-total">
            <span>Total ({order.paymentMethod})</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </div>

        <div className="admin-order-side">
          <div className="panel">
            <h2>
              <UserIcon size={18} /> Customer
            </h2>
            <address>
              <strong>{order.customer.fullName}</strong>
              <br />
              {order.customer.addressLine}
              <br />
              {order.customer.city}, {order.customer.state} {order.customer.pincode}
              <br />
              Phone: {order.customer.phone}
            </address>
            {order.user && (
              <p className="admin-acct-line">
                Account: <strong>{order.user.name}</strong> ({order.user.email})
              </p>
            )}
          </div>

          <div className="panel">
            <h2>
              <BoltIcon size={18} /> Update Status
            </h2>
            <div className="status-update-row">
              <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={changeStatus}
                disabled={saving || nextStatus === order.status}
              >
                {saving ? 'Updating…' : 'Update'}
              </button>
            </div>
            <p className="form-note">
              Cancelling an active order automatically returns items to stock.
            </p>
          </div>

          <div className="panel">
            <h2>
              <TruckIcon size={18} /> Delivery
            </h2>
            <p className="payment-line">
              {order.paymentMethod} · {order.deliveryCharge === 0 ? 'Free delivery' : `${formatPrice(order.deliveryCharge)} delivery fee`}
            </p>
          </div>
        </div>
      </div>

      <Link to="/admin/orders" className="continue-link">
        ← Back to all orders
      </Link>
    </div>
  );
}

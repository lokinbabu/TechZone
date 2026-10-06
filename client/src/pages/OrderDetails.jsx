import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { formatPrice, formatDate, statusClass, STATUS_STEPS } from '../utils/format';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { TruckIcon, BoltIcon } from '../components/Icons';
import './Orders.css';

const FALLBACK = '/images/products/fallback.svg';

export default function OrderDetails() {
  const { id } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .getOrder(id)
      .then((d) => setOrder(d.order))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size={44} label="Loading order…" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        <EmptyState
          icon="⚠"
          title={error?.status === 404 ? 'Order not found' : 'Could not load order'}
          message={error?.status === 404 ? 'This order does not exist or belongs to another account.' : error?.message}
          actionLabel="Back to My Orders"
          actionTo="/orders"
        />
      </div>
    );
  }

  const canCancel = ['Placed', 'Processing'].includes(order.status);
  const stepIndex = STATUS_STEPS.indexOf(order.status);

  const doCancel = async () => {
    setCancelling(true);
    try {
      const d = await api.cancelOrder(order._id);
      setOrder(d.order);
      toast.success('Order cancelled. Items returned to stock.');
    } catch (err) {
      toast.error(err.message || 'Could not cancel order');
    } finally {
      setCancelling(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="container order-details">
      <div className="page-head">
        <div>
          <h1>
            Order <span className="mono"># {order._id.slice(-8).toUpperCase()}</span>
          </h1>
          <p className="page-sub">
            Placed {formatDate(order.createdAt, true)} · {order.paymentMethod}
          </p>
        </div>
        <span className={`order-status lg ${statusClass(order.status)}`}>{order.status}</span>
      </div>

      {/* Status timeline */}
      {order.status !== 'Cancelled' && (
        <div className="panel timeline-panel">
          <div className="timeline">
            {STATUS_STEPS.map((step, i) => (
              <div
                key={step}
                className={`timeline-step ${i < stepIndex ? 'done' : ''} ${i === stepIndex ? 'current' : ''}`}
              >
                <span className="timeline-dot" />
                <span className="timeline-label">{step}</span>
                {i < STATUS_STEPS.length - 1 && <span className="timeline-line" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="order-details-grid">
        <div className="panel">
          <h2>Items ({order.items.length})</h2>
          <div className="co-items">
            {order.items.map((i, idx) => (
              <Link
                key={`${i.product}-${idx}`}
                to={`/product/${i.product}`}
                className="co-item clickable"
              >
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
              </Link>
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
            <span>Total</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </div>

        <div className="order-details-side">
          <div className="panel">
            <h2>
              <TruckIcon size={18} /> Delivery Address
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
          </div>

          <div className="panel">
            <h2>
              <BoltIcon size={18} /> Payment
            </h2>
            <p className="payment-line">
              {order.paymentMethod} — pay {formatPrice(order.totalAmount)} in cash on delivery.
            </p>
            {canCancel && (
              <button
                type="button"
                className="btn btn-danger-ghost btn-block"
                onClick={() => setConfirmOpen(true)}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling…' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Cancel this order?"
        message="Stock will be restored and this action cannot be undone."
        confirmLabel="Yes, cancel order"
        danger
        onConfirm={doCancel}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

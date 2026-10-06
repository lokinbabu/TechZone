import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import { formatPrice, formatDate, statusClass } from '../utils/format';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { CheckIcon, TruckIcon } from '../components/Icons';
import './OrderSuccess.css';

const FALLBACK = '/images/products/fallback.svg';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getOrder(id)
      .then((d) => !cancelled && setOrder(d.order))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size={44} label="Confirming your order…" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        <EmptyState
          icon="⚠"
          title="Order not found"
          message="We couldn't find this order. It may belong to another account."
          actionLabel="View My Orders"
          actionTo="/orders"
        />
      </div>
    );
  }

  return (
    <div className="container success-page">
      <div className="success-hero">
        <span className="success-check">
          <CheckIcon size={34} />
        </span>
        <h1>ORDER CONFIRMED</h1>
        <p className="success-msg">Your order has been placed successfully.</p>
        <p className="success-sub">
          Keep your phone handy — we'll call before delivery. Pay{' '}
          <strong>{formatPrice(order.totalAmount)}</strong> in cash on arrival.
        </p>
      </div>

      <div className="success-grid">
        <div className="panel order-summary-panel">
          <div className="panel-head">
            <h2>Order Summary</h2>
            <span className={`order-status ${statusClass(order.status)}`}>{order.status}</span>
          </div>

          <div className="success-meta">
            <div>
              <span>Order ID</span>
              <strong className="mono">{order._id.slice(-8).toUpperCase()}</strong>
            </div>
            <div>
              <span>Placed on</span>
              <strong>{formatDate(order.createdAt, true)}</strong>
            </div>
            <div>
              <span>Payment</span>
              <strong>{order.paymentMethod}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong className="grad-text">{formatPrice(order.totalAmount)}</strong>
            </div>
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
                    {i.qty} × {formatPrice(i.price)}
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
            <span>Total</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </div>

        <div className="panel address-panel">
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
          <div className="success-actions">
            <Link to="/orders" className="btn btn-primary">
              View My Orders
            </Link>
            <Link to="/shop" className="btn btn-ghost">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

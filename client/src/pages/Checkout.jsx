import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import { BoltIcon, ShieldIcon, CheckIcon } from '../components/Icons';
import './Checkout.css';

const FIELDS = [
  { name: 'fullName', label: 'Full Name', placeholder: 'e.g. Arjun Mehta', autoComplete: 'name' },
  { name: 'phone', label: 'Phone Number', placeholder: '10-digit mobile number', autoComplete: 'tel' },
  { name: 'addressLine', label: 'Address', placeholder: 'House no, street, area', autoComplete: 'street-address' },
  { name: 'city', label: 'City', placeholder: 'e.g. Hyderabad', autoComplete: 'address-level2' },
  { name: 'state', label: 'State', placeholder: 'e.g. Telangana', autoComplete: 'address-level1' },
  { name: 'pincode', label: 'Pincode', placeholder: 'e.g. 500081', autoComplete: 'postal-code' },
];

const CLIENT_VALIDATORS = {
  fullName: (v) => (v.trim().length >= 2 ? '' : 'Please enter your full name'),
  phone: (v) => (/^[+\d][\d\s-]{6,15}$/.test(v.trim()) ? '' : 'Enter a valid phone number'),
  addressLine: (v) => (v.trim().length >= 6 ? '' : 'Enter your complete address'),
  city: (v) => (v.trim().length >= 2 ? '' : 'Enter your city'),
  state: (v) => (v.trim().length >= 2 ? '' : 'Enter your state'),
  pincode: (v) => (/^\d{4,10}$/.test(v.trim()) ? '' : 'Enter a valid pincode'),
};

export default function Checkout() {
  const { items, subtotal, delivery, total, clear } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState(() => ({
    fullName: user?.name || '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
  }));
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
  };

  const validateAll = () => {
    const next = {};
    for (const f of FIELDS) next[f.name] = CLIENT_VALIDATORS[f.name](form[f.name] || '');
    return Object.fromEntries(Object.entries(next).filter(([, v]) => v));
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    const errs = validateAll();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    setPlacing(true);
    try {
      const payload = {
        items: items.map((i) => ({ product: i._id, qty: i.qty })),
        customer: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          addressLine: form.addressLine.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
        },
        paymentMethod: 'Cash on Delivery',
      };
      const data = await api.createOrder(payload);
      clear();
      toast.success('Your order has been placed successfully.');
      navigate(`/order-success/${data.order._id}`, { replace: true });
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      toast.error(err.message || 'Could not place your order');
      setPlacing(false);
    }
  };

  if (items.length === 0 && !placing) {
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        <EmptyState
          icon="🛒"
          title="Nothing to check out"
          message="Your cart is empty. Add some gear first."
          actionLabel="Explore Store"
          actionTo="/shop"
        />
      </div>
    );
  }

  return (
    <div className="container checkout">
      <div className="page-head">
        <h1>Checkout</h1>
        <nav className="checkout-steps" aria-label="Checkout progress">
          <span className="done">Cart</span> →
          <span className="current">Details</span> →
          <span>Confirmed</span>
        </nav>
      </div>

      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={placeOrder} noValidate>
          <h2>Delivery Details</h2>
          <p className="form-hint">
            Delivering as <strong>{user?.name}</strong> ({user?.email})
          </p>

          {FIELDS.map((f) => (
            <div key={f.name} className={`field ${errors[f.name] ? 'has-error' : ''}`}>
              <label htmlFor={`co-${f.name}`}>{f.label}</label>
              <input
                id={`co-${f.name}`}
                name={f.name}
                type={f.name === 'phone' || f.name === 'pincode' ? 'tel' : 'text'}
                placeholder={f.placeholder}
                autoComplete={f.autoComplete}
                value={form[f.name]}
                onChange={onChange}
              />
              {errors[f.name] && <span className="field-error">{errors[f.name]}</span>}
            </div>
          ))}

          <div className="payment-box">
            <div className="payment-head">
              <h2>Payment Method</h2>
              <span className="payment-tag">COD</span>
            </div>
            <label className="payment-option selected">
              <span className="radio-dot" />
              <div>
                <strong>Cash on Delivery</strong>
                <small>Pay in cash when your order arrives at your door.</small>
              </div>
              <CheckIcon size={18} className="payment-check" />
            </label>
            <p className="payment-note">
              <BoltIcon size={14} /> Online payment gateway is not required — orders are confirmed
              instantly and settled on delivery.
            </p>
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={placing}>
            {placing ? <Spinner size={20} /> : `Place Order · ${formatPrice(total)}`}
          </button>
          <p className="summary-secure">
            <ShieldIcon size={14} /> Your order is validated against live stock before confirmation.
          </p>
        </form>

        <aside className="checkout-summary">
          <h2>Your Order</h2>
          <div className="co-items">
            {items.map((i) => (
              <div key={i._id} className="co-item">
                <img
                  src={i.image || '/images/products/fallback.svg'}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.src = '/images/products/fallback.svg';
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
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span className={delivery === 0 ? 'free' : ''}>
              {delivery === 0 ? 'FREE' : formatPrice(delivery)}
            </span>
          </div>
          <div className="summary-row summary-total">
            <span>Total (COD)</span>
            <span>{formatPrice(total)}</span>
          </div>
          <Link to="/cart" className="continue-link">
            ← Back to cart
          </Link>
        </aside>
      </div>
    </div>
  );
}

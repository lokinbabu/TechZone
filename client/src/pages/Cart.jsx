import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/format';
import EmptyState from '../components/EmptyState';
import QtySelector from '../components/QtySelector';
import { TrashIcon, BoltIcon, ShieldIcon } from '../components/Icons';
import './Cart.css';

const FALLBACK = '/images/products/fallback.svg';

export default function Cart() {
  const { items, subtotal, delivery, total, setQty, removeItem, clear } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const hasStockIssues = items.some((i) => i.stock <= 0 || i.qty > i.stock);

  const goCheckout = () => {
    if (hasStockIssues) {
      toast.error('Fix quantity issues before checking out');
      return;
    }
    navigate(user ? '/checkout' : '/login', {
      state: user ? undefined : { from: '/checkout' },
    });
  };

  if (items.length === 0) {
    return (
      <div className="container cart-page">
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          message="Looks like you haven't added any gear yet. Explore the store to power up."
          actionLabel="Explore Store"
          actionTo="/shop"
        />
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <div className="page-head">
        <h1>
          Your Cart <span className="count-pill">{items.length}</span>
        </h1>
        <button type="button" className="link-btn danger" onClick={clear}>
          Clear cart
        </button>
      </div>

      <div className="cart-grid">
        <div className="cart-list">
          {items.map((item) => {
            const outOfStock = item.stock <= 0;
            const overStock = !outOfStock && item.qty > item.stock;
            return (
              <div key={item._id} className={`cart-item ${outOfStock ? 'oos' : ''}`}>
                <Link to={`/product/${item._id}`} className="cart-item-media">
                  <img
                    src={item.image || FALLBACK}
                    alt={item.name}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK;
                    }}
                  />
                </Link>

                <div className="cart-item-info">
                  <span className="cart-item-brand">{item.brand}</span>
                  <Link to={`/product/${item._id}`} className="cart-item-name">
                    {item.name}
                  </Link>
                  <span className="cart-item-price">{formatPrice(item.price)} each</span>
                  {outOfStock && <span className="cart-item-warn">✕ This item went out of stock</span>}
                  {!outOfStock && overStock && (
                    <span className="cart-item-warn">
                      ⚠ Only {item.stock} available — reduce quantity
                    </span>
                  )}
                </div>

                <div className="cart-item-actions">
                  <QtySelector
                    value={item.qty}
                    onChange={(q) => setQty(item._id, q)}
                    max={Math.max(1, Math.min(10, item.stock || 1))}
                  />
                  <span className="cart-item-total">{formatPrice(item.price * item.qty)}</span>
                  <button
                    type="button"
                    className="icon-btn danger"
                    onClick={() => {
                      removeItem(item._id);
                      toast.info(`Removed "${item.name}" from cart`);
                    }}
                    aria-label={`Remove ${item.name}`}
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
              </div>
            );
          })}

          <Link to="/shop" className="continue-link">
            ← Continue shopping
          </Link>
        </div>

        <aside className="cart-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal ({items.reduce((s, i) => s + i.qty, 0)} items)</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span className={delivery === 0 ? 'free' : ''}>
              {delivery === 0 ? 'FREE' : formatPrice(delivery)}
            </span>
          </div>
          {delivery > 0 && (
            <p className="summary-note">
              Add {formatPrice(999 - subtotal)} more for free delivery
            </p>
          )}
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <p className="summary-cod">
            <BoltIcon size={14} /> Cash on Delivery available at checkout
          </p>

          {hasStockIssues && (
            <p className="summary-error">⚠ Resolve stock warnings above to continue</p>
          )}

          <button
            type="button"
            className="btn btn-primary btn-lg btn-block"
            onClick={goCheckout}
            disabled={hasStockIssues}
          >
            Proceed to Checkout
          </button>
          <p className="summary-secure">
            <ShieldIcon size={14} /> Secure checkout · 7-day returns
          </p>
        </aside>
      </div>
    </div>
  );
}

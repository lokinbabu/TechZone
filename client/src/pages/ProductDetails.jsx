import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import Rating from '../components/Rating';
import QtySelector from '../components/QtySelector';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, discountPercent } from '../utils/format';
import { CartIcon, BoltIcon, ShieldIcon, TruckIcon, CheckIcon } from '../components/Icons';
import './ProductDetails.css';

const FALLBACK = '/images/products/fallback.svg';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setProduct(null);
    setQty(1);
    setActiveImg(0);

    (async () => {
      try {
        const data = await api.getProduct(id);
        if (cancelled) return;
        setProduct(data.product);
        try {
          const rel = await api.getProducts({ category: data.product.category, limit: 8 });
          if (!cancelled) setRelated((rel.products || []).filter((p) => p._id !== id).slice(0, 4));
        } catch {
          /* related products are optional */
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size={44} label="Loading product…" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        <EmptyState
          icon="🛰"
          title={error?.status === 404 ? 'Product not found' : 'Could not load product'}
          message={
            error?.status === 404
              ? 'The product you are looking for does not exist or was removed.'
              : error?.message
          }
          actionLabel="Back to Shop"
          actionTo="/shop"
        />
      </div>
    );
  }

  const discount = discountPercent(product.price, product.originalPrice);
  const outOfStock = product.stock <= 0;
  const images = product.images?.length ? product.images : [FALLBACK];
  const maxQty = Math.min(10, product.stock || 1);

  const addToCart = () => {
    addItem(product, qty);
    toast.success(`Added ${qty} × "${product.name}" to your cart`);
  };

  const buyNow = () => {
    addItem(product, qty);
    navigate('/checkout');
  };

  return (
    <div className="container pdp">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link> <span>/</span>
        <Link to="/shop">Shop</Link> <span>/</span>
        <Link to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
        <span>/</span>
        <span className="crumb-current">{product.name}</span>
      </nav>

      <div className="pdp-grid">
        <div className="pdp-media">
          <div className="pdp-image">
            <img
              src={images[activeImg] || FALLBACK}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.src = FALLBACK;
              }}
            />
            {discount > 0 && <span className="badge badge-discount pdp-badge">-{discount}%</span>}
          </div>
          {images.length > 1 && (
            <div className="pdp-thumbs">
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  className={`pdp-thumb ${i === activeImg ? 'active' : ''}`}
                  onClick={() => setActiveImg(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  <img
                    src={src}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pdp-info">
          <span className="pdp-brand">{product.brand}</span>
          <h1>{product.name}</h1>
          <div className="pdp-rating-row">
            <Rating value={product.rating} numReviews={product.numReviews} size={17} />
          </div>

          <div className="pdp-pricing">
            <span className="price-current">{formatPrice(product.price)}</span>
            {discount > 0 && (
              <>
                <span className="price-original">{formatPrice(product.originalPrice)}</span>
                <span className="badge badge-discount">Save {discount}%</span>
              </>
            )}
          </div>

          <p className="pdp-desc">{product.description}</p>

          <div className={`pdp-stock ${outOfStock ? 'oos' : product.stock <= 5 ? 'low' : 'in'}`}>
            {outOfStock ? (
              <>✕ Out of stock — check back soon</>
            ) : product.stock <= 5 ? (
              <>⚡ Only {product.stock} left — order soon</>
            ) : (
              <>
                <CheckIcon size={15} /> In stock · {product.stock} units available
              </>
            )}
            {product.stock > 0 && <span className="stock-unit">· Max {maxQty} per order</span>}
          </div>

          {outOfStock ? (
            <div className="pdp-actions">
              <button className="btn btn-primary btn-lg" disabled>
                Out of Stock
              </button>
              <Link className="btn btn-ghost btn-lg" to="/shop">
                Explore Similar
              </Link>
            </div>
          ) : (
            <div className="pdp-actions">
              <QtySelector value={qty} onChange={setQty} max={maxQty} />
              <button className="btn btn-primary btn-lg" onClick={addToCart} disabled={outOfStock}>
                <CartIcon size={18} /> Add to Cart
              </button>
              <button className="btn btn-accent btn-lg" onClick={buyNow} disabled={outOfStock}>
                <BoltIcon size={18} /> Buy Now
              </button>
            </div>
          )}

          <div className="pdp-assurances">
            <span>
              <ShieldIcon size={17} /> Genuine product warranty
            </span>
            <span>
              <TruckIcon size={17} /> Free delivery over ₹999
            </span>
            <span>
              <BoltIcon size={17} /> COD available
            </span>
          </div>
        </div>
      </div>

      {product.specifications?.length > 0 && (
        <section className="pdp-specs">
          <h2>Specifications</h2>
          <div className="spec-table">
            {product.specifications.map((s) => (
              <div key={`${s.label}-${s.value}`} className="spec-row">
                <span className="spec-label">{s.label}</span>
                <span className="spec-value">{s.value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="pdp-related">
          <h2>You May Also Like</h2>
          <div className="product-grid grid-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

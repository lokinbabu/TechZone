import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { formatPrice, CATEGORY_META } from '../utils/format';
import { BoltIcon, ShieldIcon, TruckIcon, ChipIcon, ChevronRight } from '../components/Icons';
import './Home.css';

const CATEGORIES = ['Gaming', 'Laptops', 'Audio', 'Keyboards', 'Monitors', 'Accessories'];

const BENEFITS = [
  {
    icon: <ShieldIcon size={26} />,
    title: 'Verified Products',
    text: 'Every item is sourced through authorized channels and backed by warranty.',
  },
  {
    icon: <TruckIcon size={26} />,
    title: 'Fast Delivery',
    text: 'Dispatched within 24 hours with real-time tracking to your doorstep.',
  },
  {
    icon: <BoltIcon size={26} />,
    title: 'Secure Checkout',
    text: 'Encrypted sessions, validated orders and cash-on-delivery convenience.',
  },
  {
    icon: <ChipIcon size={26} />,
    title: 'Tech-Focused Selection',
    text: 'A hand-picked catalog built for gamers, creators and innovators.',
  },
];

function ProductRow({ title, to, linkLabel, children }) {
  return (
    <section className="section container">
      <div className="section-head">
        <div>
          <h2>{title}</h2>
        </div>
        <Link className="section-link" to={to}>
          {linkLabel} <ChevronRight size={16} />
        </Link>
      </div>
      {children}
    </section>
  );
}

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, f] = await Promise.all([api.getTrending(), api.getFeatured()]);
        if (cancelled) return;
        setTrending(t.products || []);
        setFeatured(f.products || []);
        // Featured deal = the discounted product with the biggest discount
        const withDiscounts = (f.products || [])
          .filter((p) => p.originalPrice && p.originalPrice > p.price && p.stock > 0)
          .sort(
            (a, b) =>
              (b.originalPrice - b.price) / b.originalPrice -
              (a.originalPrice - a.price) / a.originalPrice
          );
        setDeal(withDiscounts[0] || null);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size={44} label="Loading the store…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 80 }}>
        <EmptyState
          icon="⚠"
          title="Could not load the store"
          message={error}
          actionLabel="Try Again"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="home">
      {/* ---------- HERO ---------- */}
      <section className="hero">
        <div className="hero-bg" aria-hidden="true" />
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="hero-eyebrow">✦ Next-gen gear · Est. 2026</span>
            <h1>
              POWER YOUR
              <br />
              <span className="grad-text">NEXT LEVEL.</span>
            </h1>
            <p className="hero-sub">
              Premium technology for gamers, creators and innovators.
            </p>
            <div className="hero-actions">
              <Link to="/shop" className="btn btn-primary btn-lg">
                Explore Store
              </Link>
              <Link to="/shop?category=Gaming" className="btn btn-ghost btn-lg">
                Shop Gaming
              </Link>
            </div>
            <div className="hero-stats">
              <div>
                <strong>{trending.length + featured.length}+</strong>
                <span>Featured items</span>
              </div>
              <div>
                <strong>4.6★</strong>
                <span>Average rating</span>
              </div>
              <div>
                <strong>24h</strong>
                <span>Dispatch</span>
              </div>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-orbit" />
            <div className="hero-ring r1" />
            <div className="hero-ring r2" />
            <div className="hero-chip">
              <span className="hero-chip-core" />
            </div>
            <div className="hero-float f1">
              <span>RTX 4080</span>
              <small>Ready</small>
            </div>
            <div className="hero-float f2">
              <span>240Hz</span>
              <small>QHD+</small>
            </div>
            <div className="hero-float f3">
              <span>Wi-Fi 6E</span>
              <small>Ultra-low latency</small>
            </div>
          </div>
        </div>
        <div className="hero-glow" aria-hidden="true" />
      </section>

      {/* ---------- FEATURED CATEGORIES ---------- */}
      <section className="section container">
        <div className="section-head">
          <h2>Featured Categories</h2>
        </div>
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <Link key={c} to={`/shop?category=${encodeURIComponent(c)}`} className="cat-card">
              <span className="cat-icon" aria-hidden="true">
                {CATEGORY_META[c]?.icon || '✦'}
              </span>
              <h3>{c}</h3>
              <p>{CATEGORY_META[c]?.tagline}</p>
              <span className="cat-go">
                Explore <ChevronRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- TRENDING ---------- */}
      <ProductRow title="Trending Now" to="/shop?sort=rating" linkLabel="View all">
        {trending.length === 0 ? (
          <EmptyState compact icon="🛰" title="Nothing trending yet" message="Check back soon." />
        ) : (
          <div className="product-grid grid-4">
            {trending.slice(0, 4).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </ProductRow>

      {/* ---------- FEATURED DEAL ---------- */}
      {deal && (
        <section className="section container">
          <div className="deal-banner">
            <div className="deal-info">
              <span className="deal-badge">
                <BoltIcon size={16} /> Featured Deal
              </span>
              <h2>{deal.name}</h2>
              <p className="deal-tagline">{CATEGORY_META[deal.category]?.tagline}</p>
              <div className="deal-pricing">
                <span className="price-current">{formatPrice(deal.price)}</span>
                <span className="price-original">{formatPrice(deal.originalPrice)}</span>
                <span className="badge badge-discount">
                  Save {formatPrice(deal.originalPrice - deal.price)}
                </span>
              </div>
              <div className="deal-actions">
                <Link to={`/product/${deal._id}`} className="btn btn-primary">
                  View Deal
                </Link>
                <Link to="/shop?deals=1" className="btn btn-ghost">
                  All Deals
                </Link>
              </div>
            </div>
            <Link to={`/product/${deal._id}`} className="deal-visual" aria-label={deal.name}>
              <img
                src={deal.images?.[0] || '/images/products/fallback.svg'}
                alt=""
                onError={(e) => {
                  e.currentTarget.src = '/images/products/fallback.svg';
                }}
              />
            </Link>
          </div>
        </section>
      )}

      {/* ---------- FEATURED PRODUCTS ---------- */}
      <ProductRow title="Handpicked for You" to="/shop" linkLabel="Browse store">
        {featured.length === 0 ? (
          <EmptyState compact icon="✦" title="No featured products" message="Check back soon." />
        ) : (
          <div className="product-grid grid-4">
            {featured.slice(0, 4).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </ProductRow>

      {/* ---------- WHY TECHZONE ---------- */}
      <section className="section container">
        <div className="section-head">
          <h2>Why TechZone?</h2>
        </div>
        <div className="benefits-grid">
          {BENEFITS.map((b) => (
            <div key={b.title} className="benefit-card">
              <span className="benefit-icon">{b.icon}</span>
              <h3>{b.title}</h3>
              <p>{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CTA STRIP ---------- */}
      <section className="container">
        <div className="cta-strip">
          <div>
            <h2>Ready to upgrade your setup?</h2>
            <p>Free delivery on orders over ₹999 · Cash on Delivery available</p>
          </div>
          <Link to="/shop" className="btn btn-primary btn-lg">
            Start Shopping
          </Link>
        </div>
      </section>
    </div>
  );
}

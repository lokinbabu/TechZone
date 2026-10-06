import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { CATEGORY_ICONS } from '../utils/format';
import { CloseIcon, SearchIcon } from '../components/Icons';
import './Shop.css';

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest' },
];

const PRICE_BOUNDS = { min: 0, max: 150000 };

export default function Shop() {
  const [params, setParams] = useSearchParams();

  const search = params.get('search') || '';
  const category = params.get('category') || 'All';
  const brand = params.get('brand') || 'All';
  const sort = params.get('sort') || 'featured';
  const inStock = params.get('inStock') === '1';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const rating = params.get('rating') || '';
  const deals = params.get('deals') === '1';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);

  const [meta, setMeta] = useState({ categories: [], brands: [] });
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState(search);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => setSearchInput(search), [search]);

  useEffect(() => {
    api
      .getProductMeta()
      .then((d) => setMeta({ categories: d.categories || [], brands: d.brands || [] }))
      .catch(() => {});
  }, []);

  const query = useMemo(
    () => ({
      search,
      category: category !== 'All' ? category : '',
      brand: brand !== 'All' ? brand : '',
      sort,
      inStock: inStock ? 'true' : '',
      minPrice,
      maxPrice,
      rating,
      page,
      limit: 12,
    }),
    [search, category, brand, sort, inStock, minPrice, maxPrice, rating, page]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getProducts(query)
      .then((data) => {
        if (cancelled) return;
        let list = data.products || [];
        // Deals view: keep discounted items only
        if (deals) list = list.filter((p) => p.originalPrice && p.originalPrice > p.price);
        setProducts(list);
        setPagination(data.pagination || { total: list.length, pages: 1 });
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query, deals]);

  const updateParams = (patch, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '' || v === false) next.delete(k);
      else next.set(k, v === true ? '1' : String(v));
    });
    if (resetPage) next.delete('page');
    setParams(next, { replace: false });
  };

  const activeFilters =
    (category !== 'All' ? 1 : 0) +
    (brand !== 'All' ? 1 : 0) +
    (inStock ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (rating ? 1 : 0);

  const clearAll = () => {
    const next = new URLSearchParams();
    if (search) next.set('search', search);
    if (deals) next.set('deals', '1');
    setParams(next);
  };

  const applyPrice = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateParams({
      minPrice: fd.get('minPrice'),
      maxPrice: fd.get('maxPrice'),
    });
  };

  const filtersPanel = (
    <aside className="filters">
      <div className="filters-head">
        <h3>
          Filters {activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}
        </h3>
        {activeFilters > 0 && (
          <button type="button" className="link-btn" onClick={clearAll}>
            Clear all
          </button>
        )}
      </div>

      <div className="filter-group">
        <h4>Category</h4>
        <div className="filter-chips">
          {['All', ...meta.categories].map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${category === c ? 'active' : ''}`}
              onClick={() => updateParams({ category: c === 'All' ? '' : c })}
            >
              {CATEGORY_ICONS[c] ? `${CATEGORY_ICONS[c]} ` : ''}
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <h4>Brand</h4>
        <div className="filter-chips">
          {['All', ...meta.brands].map((b) => (
            <button
              key={b}
              type="button"
              className={`chip ${brand === b ? 'active' : ''}`}
              onClick={() => updateParams({ brand: b === 'All' ? '' : b })}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <h4>Price (₹)</h4>
        <form className="price-inputs" onSubmit={applyPrice}>
          <input
            type="number"
            name="minPrice"
            placeholder={`Min`}
            min={0}
            defaultValue={minPrice}
            key={`min-${minPrice}`}
          />
          <span>—</span>
          <input
            type="number"
            name="maxPrice"
            placeholder={`Max`}
            min={0}
            defaultValue={maxPrice}
            key={`max-${maxPrice}`}
          />
          <button type="submit" className="btn btn-ghost btn-sm">
            Go
          </button>
        </form>
        <div className="price-quick">
          {[
            ['Under ₹5K', 0, 5000],
            ['₹5K–₹15K', 5000, 15000],
            ['₹15K–₹50K', 15000, 50000],
            ['₹50K+', 50000, PRICE_BOUNDS.max],
          ].map(([label, lo, hi]) => (
            <button
              key={label}
              type="button"
              className={`chip ${Number(minPrice) === lo && Number(maxPrice) === hi ? 'active' : ''}`}
              onClick={() => updateParams({ minPrice: lo, maxPrice: hi })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <h4>Rating</h4>
        <div className="filter-chips">
          {['', '4', '4.5'].map((r) => (
            <button
              key={r || 'any'}
              type="button"
              className={`chip ${rating === r ? 'active' : ''}`}
              onClick={() => updateParams({ rating: r })}
            >
              {r ? `${r}★ & up` : 'Any'}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <h4>Availability</h4>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => updateParams({ inStock: e.target.checked })}
          />
          <span>In stock only</span>
        </label>
      </div>
    </aside>
  );

  return (
    <div className="shop container">
      <div className="shop-head">
        <div>
          <h1>{deals ? 'Deals Zone' : category !== 'All' ? category : 'Shop'}</h1>
          <p className="shop-sub">
            {loading
              ? 'Fetching products…'
              : `${pagination.total} product${pagination.total === 1 ? '' : 's'} found`}
            {search ? ` for “${search}”` : ''}
          </p>
        </div>

        <form
          className="shop-search"
          onSubmit={(e) => {
            e.preventDefault();
            updateParams({ search: searchInput.trim() });
          }}
        >
          <SearchIcon size={17} />
          <input
            type="search"
            placeholder="Search by name, brand or category…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search products"
          />
          {searchInput && (
            <button
              type="button"
              className="search-clear"
              onClick={() => {
                setSearchInput('');
                updateParams({ search: '' });
              }}
              aria-label="Clear search"
            >
              <CloseIcon size={14} />
            </button>
          )}
        </form>

        <div className="shop-controls">
          <button
            type="button"
            className="btn btn-ghost btn-sm filters-toggle"
            onClick={() => setMobileFiltersOpen((o) => !o)}
          >
            Filters {activeFilters > 0 ? `(${activeFilters})` : ''}
          </button>
          <label className="sort-select">
            <span>Sort</span>
            <select value={sort} onChange={(e) => updateParams({ sort: e.target.value })}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="shop-body">
        {mobileFiltersOpen && (
          <div className="filters-mobile" onClick={() => setMobileFiltersOpen(false)}>
            <div className="filters-mobile-inner" onClick={(e) => e.stopPropagation()}>
              {filtersPanel}
              <button
                type="button"
                className="btn btn-primary filters-done"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Show Results
              </button>
            </div>
          </div>
        )}

        {filtersPanel}

        <div className="shop-results">
          {loading ? (
            <div className="grid-loading">
              <Spinner size={40} label="Loading products…" />
            </div>
          ) : error ? (
            <EmptyState
              icon="⚠"
              title="Failed to load products"
              message={error}
              actionLabel="Try Again"
              onAction={() => window.location.reload()}
            />
          ) : products.length === 0 ? (
            <EmptyState
              icon="🛰"
              title="No products found"
              message="No gear matches your search or filters. Try adjusting them."
              actionLabel="Clear Filters"
              onAction={clearAll}
              secondaryLabel="Browse everything"
              secondaryTo="/shop"
            />
          ) : (
            <>
              <div className="product-grid grid-3">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>

              {pagination.pages > 1 && (
                <nav className="pagination" aria-label="Pagination">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => updateParams({ page: page - 1 }, false)}
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={n === page ? 'active' : ''}
                      onClick={() => updateParams({ page: n }, false)}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={page >= pagination.pages}
                    onClick={() => updateParams({ page: page + 1 }, false)}
                  >
                    Next →
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

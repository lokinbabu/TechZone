import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/format';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { EditIcon, TrashIcon, SearchIcon, PlusIcon } from '../../components/Icons';
import './admin.css';

const FALLBACK = '/images/products/fallback.svg';

export default function AdminProducts() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [stockDraft, setStockDraft] = useState({});
  const [confirmId, setConfirmId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .getProducts({ limit: 48, sort: 'newest' })
      .then((d) => setProducts(d.products || []))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, search]);

  const saveStock = async (p) => {
    const draft = stockDraft[p._id];
    if (draft === undefined || Number(draft) === p.stock) return;
    setSavingId(p._id);
    try {
      const d = await api.updateStock(p._id, Number(draft));
      setProducts((list) => list.map((x) => (x._id === p._id ? d.product : x)));
      toast.success(`Stock updated for "${p.name}"`);
      setStockDraft((s) => {
        const { [p._id]: _, ...rest } = s;
        return rest;
      });
    } catch (err) {
      toast.error(err.message || 'Could not update stock');
    } finally {
      setSavingId(null);
    }
  };

  const doDelete = async () => {
    const p = products.find((x) => x._id === confirmId);
    setConfirmId(null);
    if (!p) return;
    try {
      await api.deleteProduct(p._id);
      setProducts((list) => list.filter((x) => x._id !== p._id));
      toast.success(`Deleted "${p.name}"`);
    } catch (err) {
      toast.error(err.message || 'Could not delete product');
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size={44} label="Loading products…" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠"
        title="Failed to load products"
        message={error.message}
        actionLabel="Retry"
        onAction={load}
      />
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Products</h1>
          <p>{products.length} products in catalog</p>
        </div>
        <Link to="/admin/products/new" className="btn btn-primary btn-sm">
          <PlusIcon size={16} /> Add Product
        </Link>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <SearchIcon size={16} />
          <input
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title={products.length === 0 ? 'No products yet' : 'No matches'}
          message={
            products.length === 0
              ? 'Add your first product to start the catalog.'
              : 'Try a different search term.'
          }
          actionLabel={products.length === 0 ? 'Add Product' : undefined}
          actionTo={products.length === 0 ? '/admin/products/new' : undefined}
        />
      ) : (
        <div className="panel admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Rating</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const draft = stockDraft[p._id];
                const dirty = draft !== undefined && Number(draft) !== p.stock;
                return (
                  <tr key={p._id}>
                    <td>
                      <div className="admin-prod-cell">
                        <img
                          src={p.images?.[0] || FALLBACK}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK;
                          }}
                        />
                        <div>
                          <strong>{p.name}</strong>
                          <span>{p.brand}</span>
                        </div>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td>
                      {formatPrice(p.price)}
                      {p.originalPrice > p.price && (
                        <small className="admin-orig">{formatPrice(p.originalPrice)}</small>
                      )}
                    </td>
                    <td>
                      <div className="stock-editor">
                        <input
                          type="number"
                          min={0}
                          value={draft ?? p.stock}
                          onChange={(e) =>
                            setStockDraft((s) => ({ ...s, [p._id]: e.target.value }))
                          }
                          aria-label={`Stock for ${p.name}`}
                        />
                        {dirty && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => saveStock(p)}
                            disabled={savingId === p._id}
                          >
                            {savingId === p._id ? '…' : 'Save'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td>{Number(p.rating).toFixed(1)}★</td>
                    <td>
                      <span className={`pill ${p.stock > 0 ? 'pill-green' : 'pill-red'}`}>
                        {p.stock > 0 ? 'In stock' : 'Out of stock'}
                      </span>
                    </td>
                    <td className="admin-row-actions">
                      <Link to={`/admin/products/${p._id}/edit`} className="icon-btn" aria-label={`Edit ${p.name}`}>
                        <EditIcon size={17} />
                      </Link>
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => setConfirmId(p._id)}
                        aria-label={`Delete ${p.name}`}
                      >
                        <TrashIcon size={17} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmId}
        title="Delete this product?"
        message="This permanently removes the product from the catalog. Order history is not affected."
        confirmLabel="Delete"
        danger
        onConfirm={doDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

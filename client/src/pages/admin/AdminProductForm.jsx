import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { PlusIcon, TrashIcon, CloseIcon } from '../../components/Icons';
import './admin.css';

const CATEGORIES = ['Laptops', 'Gaming', 'Audio', 'Keyboards', 'Monitors', 'Components', 'Accessories'];
const FALLBACK = '/images/products/fallback.svg';

const BLANK = {
  name: '',
  brand: '',
  category: 'Laptops',
  price: '',
  originalPrice: '',
  description: '',
  images: '',
  stock: '10',
  rating: '4.5',
  numReviews: '0',
  isFeatured: false,
  isTrending: false,
};

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(BLANK);
  const [specs, setSpecs] = useState([{ label: '', value: '' }]);
  const [images, setImages] = useState([]);
  const [imageInput, setImageInput] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    api
      .getProduct(id)
      .then((d) => {
        if (cancelled) return;
        const p = d.product;
        setForm({
          name: p.name,
          brand: p.brand,
          category: p.category,
          price: String(p.price),
          originalPrice: p.originalPrice ? String(p.originalPrice) : '',
          description: p.description,
          stock: String(p.stock),
          rating: String(p.rating),
          numReviews: String(p.numReviews ?? 0),
          isFeatured: Boolean(p.isFeatured),
          isTrending: Boolean(p.isTrending),
        });
        setImages(p.images || []);
        setSpecs(p.specifications?.length ? p.specifications.map((s) => ({ ...s })) : [{ label: '', value: '' }]);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const addImage = () => {
    const url = imageInput.trim();
    if (!url) return;
    if (images.includes(url)) {
      toast.info('That image URL is already added');
      return;
    }
    setImages((imgs) => [...imgs, url]);
    setImageInput('');
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.brand.trim()) errs.brand = 'Brand is required';
    if (form.price === '' || Number(form.price) < 0) errs.price = 'Enter a valid price';
    if (form.originalPrice && Number(form.originalPrice) <= Number(form.price))
      errs.originalPrice = 'Original price must be greater than price';
    if (form.description.trim().length < 20) errs.description = 'Description should be at least 20 characters';
    if (form.stock === '' || Number(form.stock) < 0) errs.stock = 'Enter valid stock';
    if (form.rating && (Number(form.rating) < 0 || Number(form.rating) > 5)) errs.rating = 'Rating must be 0–5';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
      description: form.description.trim(),
      images: images.length ? images : [FALLBACK],
      stock: Number(form.stock),
      rating: Number(form.rating || 0),
      numReviews: Number(form.numReviews || 0),
      isFeatured: form.isFeatured,
      isTrending: form.isTrending,
      specifications: specs
        .map((s) => ({ label: (s.label || '').trim(), value: (s.value || '').trim() }))
        .filter((s) => s.label && s.value),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api.updateProduct(id, payload);
        toast.success(`"${payload.name}" updated`);
      } else {
        await api.createProduct(payload);
        toast.success(`"${payload.name}" added to the store`);
      }
      navigate('/admin/products');
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      toast.error(err.message || 'Could not save product');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size={44} label="Loading product…" />
      </div>
    );
  }

  if (notFound) {
    return (
      <EmptyState
        icon="🛰"
        title="Product not found"
        message="It may have been deleted."
        actionLabel="Back to Products"
        actionTo="/admin/products"
      />
    );
  }

  return (
    <div className="admin-page admin-form-page">
      <div className="admin-page-head">
        <div>
          <h1>{isEdit ? 'Edit Product' : 'Add Product'}</h1>
          <p>{isEdit ? 'Update catalog details — changes go live instantly.' : 'Create a new listing for the TechZone store.'}</p>
        </div>
        <Link to="/admin/products" className="btn btn-ghost btn-sm">
          <CloseIcon size={15} /> Cancel
        </Link>
      </div>

      <form className="admin-form" onSubmit={submit} noValidate>
        <div className="form-grid">
          {/* Left column */}
          <div className="panel form-panel">
            <h2>Basic Information</h2>

            <div className={`field ${errors.name ? 'has-error' : ''}`}>
              <label htmlFor="pf-name">Product Name *</label>
              <input
                id="pf-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. TechZone Phantom X Gaming Laptop"
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="field-row">
              <div className={`field ${errors.brand ? 'has-error' : ''}`}>
                <label htmlFor="pf-brand">Brand *</label>
                <input
                  id="pf-brand"
                  value={form.brand}
                  onChange={(e) => set('brand', e.target.value)}
                  placeholder="e.g. TechZone"
                />
                {errors.brand && <span className="field-error">{errors.brand}</span>}
              </div>
              <div className="field">
                <label htmlFor="pf-category">Category *</label>
                <select id="pf-category" value={form.category} onChange={(e) => set('category', e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field-row">
              <div className={`field ${errors.price ? 'has-error' : ''}`}>
                <label htmlFor="pf-price">Price (₹) *</label>
                <input
                  id="pf-price"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  placeholder="e.g. 99999"
                />
                {errors.price && <span className="field-error">{errors.price}</span>}
              </div>
              <div className={`field ${errors.originalPrice ? 'has-error' : ''}`}>
                <label htmlFor="pf-original">Original Price (₹)</label>
                <input
                  id="pf-original"
                  type="number"
                  min="0"
                  value={form.originalPrice}
                  onChange={(e) => set('originalPrice', e.target.value)}
                  placeholder="Optional — enables discount badge"
                />
                {errors.originalPrice && <span className="field-error">{errors.originalPrice}</span>}
              </div>
            </div>

            <div className={`field ${errors.description ? 'has-error' : ''}`}>
              <label htmlFor="pf-desc">Description *</label>
              <textarea
                id="pf-desc"
                rows={6}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Describe the product — what makes it premium, who it's for, key benefits…"
              />
              {errors.description && <span className="field-error">{errors.description}</span>}
            </div>

            <div className="field-row">
              <div className={`field ${errors.stock ? 'has-error' : ''}`}>
                <label htmlFor="pf-stock">Stock *</label>
                <input
                  id="pf-stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => set('stock', e.target.value)}
                />
                {errors.stock && <span className="field-error">{errors.stock}</span>}
              </div>
              <div className={`field ${errors.rating ? 'has-error' : ''}`}>
                <label htmlFor="pf-rating">Rating (0–5)</label>
                <input
                  id="pf-rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={form.rating}
                  onChange={(e) => set('rating', e.target.value)}
                />
                {errors.rating && <span className="field-error">{errors.rating}</span>}
              </div>
              <div className="field">
                <label htmlFor="pf-reviews">Review Count</label>
                <input
                  id="pf-reviews"
                  type="number"
                  min="0"
                  value={form.numReviews}
                  onChange={(e) => set('numReviews', e.target.value)}
                />
              </div>
            </div>

            <div className="field-checks">
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => set('isFeatured', e.target.checked)}
                />
                <span>Featured product (homepage)</span>
              </label>
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={form.isTrending}
                  onChange={(e) => set('isTrending', e.target.checked)}
                />
                <span>Trending product (homepage)</span>
              </label>
            </div>
          </div>

          {/* Right column */}
          <div className="form-side">
            <div className="panel form-panel">
              <h2>Images</h2>
              <p className="form-hint">
                Use local paths like <code>/images/products/phantom-x-laptop.svg</code> or full URLs.
              </p>

              <div className="image-input-row">
                <input
                  type="text"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  placeholder="https://… or /images/products/…"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addImage();
                    }
                  }}
                />
                <button type="button" className="btn btn-ghost btn-sm" onClick={addImage}>
                  <PlusIcon size={15} /> Add
                </button>
              </div>

              {images.length === 0 ? (
                <p className="form-note">No images yet — the fallback artwork will be used.</p>
              ) : (
                <div className="image-list">
                  {images.map((src, i) => (
                    <div key={`${src}-${i}`} className="image-row">
                      <img
                        src={src}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK;
                        }}
                      />
                      <span className="image-url">{src}</span>
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => setImages((imgs) => imgs.filter((_, x) => x !== i))}
                        aria-label="Remove image"
                      >
                        <TrashIcon size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel form-panel">
              <h2>Specifications</h2>
              <p className="form-hint">Flexible label → value pairs, e.g. Processor → Intel Core i7.</p>

              {specs.map((s, i) => (
                <div key={i} className="spec-editor-row">
                  <input
                    value={s.label}
                    onChange={(e) =>
                      setSpecs((list) => list.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)))
                    }
                    placeholder="Label (e.g. Processor)"
                    aria-label={`Specification ${i + 1} label`}
                  />
                  <input
                    value={s.value}
                    onChange={(e) =>
                      setSpecs((list) => list.map((x, xi) => (xi === i ? { ...x, value: e.target.value } : x)))
                    }
                    placeholder="Value (e.g. Intel Core i7)"
                    aria-label={`Specification ${i + 1} value`}
                  />
                  <button
                    type="button"
                    className="icon-btn danger"
                    onClick={() => setSpecs((list) => (list.length > 1 ? list.filter((_, xi) => xi !== i) : [{ label: '', value: '' }]))}
                    aria-label="Remove specification"
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSpecs((list) => [...list, { label: '', value: '' }])}
              >
                <PlusIcon size={15} /> Add Specification
              </button>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
          <Link to="/admin/products" className="btn btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

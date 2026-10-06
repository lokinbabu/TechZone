import { Link } from 'react-router-dom';
import Rating from './Rating';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, discountPercent } from '../utils/format';
import { CartIcon } from './Icons';
import './ProductCard.css';

const FALLBACK = '/images/products/fallback.svg';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const toast = useToast();

  const discount = discountPercent(product.price, product.originalPrice);
  const outOfStock = product.stock <= 0;
  const image = product.images?.[0] || FALLBACK;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) {
      toast.error('This product is out of stock');
      return;
    }
    addItem(product, 1);
    toast.success(`"${product.name}" added to cart`);
  };

  return (
    <Link to={`/product/${product._id}`} className={`product-card ${outOfStock ? 'is-oos' : ''}`}>
      <div className="product-card-media">
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith(FALLBACK)) e.currentTarget.src = FALLBACK;
          }}
        />
        {discount > 0 && <span className="badge badge-discount">-{discount}%</span>}
        {!outOfStock && product.isTrending && <span className="badge badge-trending">Trending</span>}
        {outOfStock && <span className="badge badge-oos">Out of Stock</span>}
      </div>

      <div className="product-card-body">
        <span className="product-card-brand">{product.brand}</span>
        <h3 className="product-card-name">{product.name}</h3>
        <Rating value={product.rating} numReviews={product.numReviews} compact />

        <div className="product-card-pricing">
          <span className="price-current">{formatPrice(product.price)}</span>
          {discount > 0 && <span className="price-original">{formatPrice(product.originalPrice)}</span>}
        </div>

        <div className="product-card-footer">
          <span className={`stock-note ${outOfStock ? 'oos' : product.stock <= 5 ? 'low' : 'in'}`}>
            {outOfStock ? 'Notify me' : product.stock <= 5 ? `Only ${product.stock} left` : 'In stock'}
          </span>
          <button
            type="button"
            className="btn btn-add"
            onClick={handleAdd}
            disabled={outOfStock}
            aria-label={`Add ${product.name} to cart`}
          >
            <CartIcon size={17} />
            <span>Add</span>
          </button>
        </div>
      </div>
    </Link>
  );
}

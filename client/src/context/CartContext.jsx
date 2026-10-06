import { createContext, useContext, useEffect, useMemo, useReducer, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CART_KEY = 'tz_cart_v1';
const MAX_QTY = 10;

const CartContext = createContext(null);

const initialState = { items: [] };

const sanitize = (items) =>
  (Array.isArray(items) ? items : [])
    .filter((i) => i && i._id && Number(i.qty) > 0)
    .map((i) => ({
      _id: String(i._id),
      name: String(i.name || 'Product'),
      brand: String(i.brand || ''),
      image: String(i.image || '/images/products/fallback.svg'),
      price: Math.max(0, Number(i.price) || 0),
      stock: Math.max(0, Number(i.stock) || 0),
      qty: Math.min(MAX_QTY, Math.max(1, Math.floor(Number(i.qty) || 1))),
    }));

const init = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return initialState;
    return { items: sanitize(JSON.parse(raw).items) };
  } catch {
    return initialState;
  }
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'HYDRATE':
      return { items: sanitize(action.items) };
    case 'ADD': {
      const product = action.product;
      if (!product?._id) return state;
      const maxQty = Math.min(MAX_QTY, Math.max(0, Number(product.stock ?? MAX_QTY)));
      const existing = state.items.find((i) => i._id === product._id);
      if (existing) {
        if (maxQty === 0 || existing.qty >= maxQty) return state;
        return {
          items: state.items.map((i) =>
            i._id === product._id ? { ...i, qty: Math.min(i.qty + 1, maxQty), stock: maxQty } : i
          ),
        };
      }
      if (maxQty === 0) return state;
      const { ...clean } = product;
      return {
        items: [
          ...state.items,
          {
            _id: String(product._id),
            name: product.name,
            brand: product.brand || '',
            image: product.images?.[0] || product.image || '/images/products/fallback.svg',
            price: Number(product.price) || 0,
            stock: maxQty,
            qty: 1,
          },
        ],
      };
    }
    case 'SET_QTY': {
      const { id, qty } = action;
      return {
        items: state.items.map((i) =>
          i._id === id
            ? { ...i, qty: Math.min(MAX_QTY, Math.max(1, Math.min(Number(qty) || 1, i.stock || MAX_QTY))) }
            : i
        ),
      };
    }
    case 'REMOVE':
      return { items: state.items.filter((i) => i._id !== action.id) };
    case 'CLEAR':
      return initialState;
    case 'SYNC_STOCK':
      // Refresh stock values coming from the server
      return {
        items: state.items.map((i) => {
          const fresh = action.stockMap?.[i._id];
          return fresh === undefined
            ? i
            : { ...i, stock: fresh, qty: Math.min(i.qty, Math.max(1, fresh)) };
        }),
      };
    default:
      return state;
  }
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const { user } = useAuth();

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(state));
    } catch {
      /* storage full — ignore */
    }
  }, [state]);

  const addItem = useCallback((product, qty = 1) => {
    let added = false;
    for (let k = 0; k < Math.max(1, qty); k++) {
      const before = state.items;
      dispatch({ type: 'ADD', product });
      added = true;
    }
    return added;
  }, [state.items]);

  const setQty = useCallback((id, qty) => dispatch({ type: 'SET_QTY', id, qty }), []);
  const removeItem = useCallback((id) => dispatch({ type: 'REMOVE', id }), []);
  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  // Keep stock values fresh when the user logs in
  useEffect(() => {
    if (!user || state.items.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getProducts({ limit: 48 });
        if (!cancelled && data.products?.length) {
          const stockMap = Object.fromEntries(data.products.map((p) => [String(p._id), p.stock]));
          dispatch({ type: 'SYNC_STOCK', stockMap });
        }
      } catch {
        /* offline — keep local cart */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(() => {
    const subtotal = state.items.reduce((s, i) => s + i.price * i.qty, 0);
    const count = state.items.reduce((s, i) => s + i.qty, 0);
    const delivery = subtotal === 0 || subtotal >= 999 ? 0 : 49;
    return {
      items: state.items,
      count,
      subtotal,
      delivery,
      total: subtotal + delivery,
      addItem,
      setQty,
      removeItem,
      clear,
    };
  }, [state.items, addItem, setQty, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);

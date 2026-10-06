export const formatPrice = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export const formatDate = (d, withTime = false) => {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  if (withTime) {
    opts.hour = '2-digit';
    opts.minute = '2-digit';
    opts.hour12 = true;
  }
  return date.toLocaleString('en-IN', opts);
};

export const discountPercent = (price, originalPrice) => {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

export const CATEGORY_META = {
  Laptops: { icon: '💻', tagline: 'Power machines for work & war' },
  Gaming: { icon: '🎮', tagline: 'Gear that wins matches' },
  Audio: { icon: '🎧', tagline: 'Studio & battle sound' },
  Keyboards: { icon: '⌨️', tagline: 'Mechanical precision' },
  Monitors: { icon: '🖥️', tagline: 'See every frame' },
  Components: { icon: '🔧', tagline: 'Upgrade your core' },
  Accessories: { icon: '🔌', tagline: 'Complete your setup' },
};

export const CATEGORY_ICONS = {
  All: '✦',
  Laptops: '💻',
  Gaming: '🎮',
  Audio: '🎧',
  Keyboards: '⌨️',
  Monitors: '🖥️',
  Components: '🔧',
  Accessories: '🔌',
};

export const STATUS_STEPS = ['Placed', 'Processing', 'Shipped', 'Delivered'];

export const statusClass = (status) =>
  ({
    Placed: 'status-placed',
    Processing: 'status-processing',
    Shipped: 'status-shipped',
    Delivered: 'status-delivered',
    Cancelled: 'status-cancelled',
  }[status] || 'status-placed');

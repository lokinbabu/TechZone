// Lightweight inline icon set — no icon library dependency
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const I = ({ children, size = 20, viewBox = '0 0 24 24', ...rest }) => (
  <svg width={size} height={size} viewBox={viewBox} {...base} {...rest} aria-hidden="true">
    {children}
  </svg>
);

export const SearchIcon = (p) => (
  <I {...p}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.2" y2="16.2" />
  </I>
);

export const CartIcon = (p) => (
  <I {...p}>
    <path d="M3 4h2l2.5 12.5a1.5 1.5 0 0 0 1.5 1.2h8.3a1.5 1.5 0 0 0 1.5-1.2L20.5 8H6" />
    <circle cx="9.5" cy="20.5" r="1.4" />
    <circle cx="17" cy="20.5" r="1.4" />
  </I>
);

export const UserIcon = (p) => (
  <I {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c1.3-3.4 4.2-5 7.5-5s6.2 1.6 7.5 5" />
  </I>
);

export const HomeIcon = (p) => (
  <I {...p}>
    <path d="M3.5 10.5 12 3.5l8.5 7" />
    <path d="M5.5 9.5V20h13V9.5" />
    <path d="M10 20v-5.5h4V20" />
  </I>
);

export const GridIcon = (p) => (
  <I {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </I>
);

export const TagIcon = (p) => (
  <I {...p}>
    <path d="M12.6 3.5H20.5v7.9l-8.8 8.8a1.7 1.7 0 0 1-2.4 0l-5.5-5.5a1.7 1.7 0 0 1 0-2.4z" />
    <circle cx="16.3" cy="7.7" r="1.4" />
  </I>
);

export const PackageIcon = (p) => (
  <I {...p}>
    <path d="M12 3 20.5 7.5v9L12 21l-8.5-4.5v-9z" />
    <path d="M3.5 7.5 12 12l8.5-4.5" />
    <path d="M12 12v9" />
  </I>
);

export const ShieldIcon = (p) => (
  <I {...p}>
    <path d="M12 3.5 19 6v5.5c0 4.6-3 7.6-7 9-4-1.4-7-4.4-7-9V6z" />
    <path d="m9.2 11.8 2 2 3.6-4" />
  </I>
);

export const TruckIcon = (p) => (
  <I {...p}>
    <path d="M2.5 6h11v10h-11z" />
    <path d="M13.5 9.5H18l3 3.5v3h-7.5" />
    <circle cx="7" cy="18.5" r="1.8" />
    <circle cx="17" cy="18.5" r="1.8" />
  </I>
);

export const BoltIcon = (p) => (
  <I {...p}>
    <path d="M13 2.5 5 13.5h5.5L10 21.5l8-11h-5.5z" />
  </I>
);

export const ChipIcon = (p) => (
  <I {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <rect x="10" y="10" width="4" height="4" />
    <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
  </I>
);

export const TrashIcon = (p) => (
  <I {...p}>
    <path d="M4 6.5h16" />
    <path d="M9 6.5V4.8A1.3 1.3 0 0 1 10.3 3.5h3.4A1.3 1.3 0 0 1 15 4.8v1.7" />
    <path d="M6.5 6.5 7.4 20a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-13.5" />
    <path d="M10 10.5v6M14 10.5v6" />
  </I>
);

export const PlusIcon = (p) => (
  <I {...p}>
    <path d="M12 5v14M5 12h14" />
  </I>
);

export const MinusIcon = (p) => (
  <I {...p}>
    <path d="M5 12h14" />
  </I>
);

export const ChevronRight = (p) => (
  <I {...p}>
    <path d="m9 5 7 7-7 7" />
  </I>
);

export const ChevronLeft = (p) => (
  <I {...p}>
    <path d="M15 5 8 12l7 7" />
  </I>
);

export const ChevronDown = (p) => (
  <I {...p}>
    <path d="m5 9 7 7 7-7" />
  </I>
);

export const MenuIcon = (p) => (
  <I {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </I>
);

export const CloseIcon = (p) => (
  <I {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </I>
);

export const DashboardIcon = (p) => (
  <I {...p}>
    <rect x="3.5" y="3.5" width="8" height="10" rx="1.5" />
    <rect x="3.5" y="16.5" width="8" height="4" rx="1.5" />
    <rect x="14.5" y="3.5" width="6" height="4" rx="1.5" />
    <rect x="14.5" y="10.5" width="6" height="10" rx="1.5" />
  </I>
);

export const BoxIcon = (p) => (
  <I {...p}>
    <rect x="4" y="7" width="16" height="13" rx="2" />
    <path d="M4 11h16M12 7v13M8 7V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V7" />
  </I>
);

export const UsersIcon = (p) => (
  <I {...p}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M2.8 19.5c1.1-3 3.5-4.5 6.2-4.5s5.1 1.5 6.2 4.5" />
    <path d="M16 5.6a3.4 3.4 0 0 1 0 5.8" />
    <path d="M18.3 15.4c1.5.7 2.5 2 3 4.1" />
  </I>
);

export const LogoutIcon = (p) => (
  <I {...p}>
    <path d="M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14" />
    <path d="M17 8.5 20.5 12 17 15.5M20 12h-9" />
  </I>
);

export const CheckIcon = (p) => (
  <I {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </I>
);

export const EditIcon = (p) => (
  <I {...p}>
    <path d="M4 20h4.5L20 8.5a2.1 2.1 0 0 0-3-3L5.5 17z" />
    <path d="m14.5 7 3 3" />
  </I>
);

export const StarSolid = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 2.6 14.9 8.6l6.5.9-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.1 1.1-6.5L2.6 9.5l6.5-.9z" />
  </svg>
);

export const StarHalf = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="tz-half">
        <stop offset="50%" stopColor="currentColor" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.14)" />
      </linearGradient>
    </defs>
    <path
      d="M12 2.6 14.9 8.6l6.5.9-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.1 1.1-6.5L2.6 9.5l6.5-.9z"
      fill="url(#tz-half)"
    />
  </svg>
);

export const Logo = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
    <rect width="64" height="64" rx="14" fill="rgba(34,211,238,0.08)" stroke="rgba(34,211,238,0.5)" />
    <path d="M32 8 51 18.5v27L32 56 13 45.5v-27z" fill="none" stroke="#22d3ee" strokeWidth="2.5" />
    <path d="M21 24h22" stroke="#22d3ee" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M32 26v16" stroke="#a78bfa" strokeWidth="4.5" strokeLinecap="round" />
  </svg>
);

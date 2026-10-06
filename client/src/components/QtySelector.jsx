import { MinusIcon, PlusIcon } from './Icons';

export default function QtySelector({ value, onChange, max = 10, min = 1 }) {
  const clamp = (n) => Math.min(Math.max(Number(n) || min, min), max);
  return (
    <div className="qty-selector" role="group" aria-label="Quantity">
      <button
        type="button"
        className="qty-btn"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <MinusIcon size={16} />
      </button>
      <input
        className="qty-input"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(e.target.value))}
        onBlur={(e) => onChange(clamp(e.target.value))}
        aria-label="Quantity"
      />
      <button
        type="button"
        className="qty-btn"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
}

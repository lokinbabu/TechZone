import './Spinner.css';

export default function Spinner({ size = 28, label }) {
  return (
    <span className="spinner-wrap" role="status" aria-label={label || 'Loading'}>
      <span className="spinner" style={{ width: size, height: size }} />
      {label ? <span className="spinner-label">{label}</span> : null}
    </span>
  );
}

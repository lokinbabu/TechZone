import { Link } from 'react-router-dom';

export default function EmptyState({
  icon = '⌀',
  title,
  message,
  actionLabel,
  actionTo,
  onAction,
  secondaryLabel,
  secondaryTo,
  compact = false,
}) {
  return (
    <div className={`empty-state ${compact ? 'empty-compact' : ''}`}>
      <div className="empty-icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {(actionLabel || secondaryLabel) && (
        <div className="empty-actions">
          {actionLabel &&
            (actionTo ? (
              <Link className="btn btn-primary" to={actionTo}>
                {actionLabel}
              </Link>
            ) : (
              <button className="btn btn-primary" onClick={onAction} type="button">
                {actionLabel}
              </button>
            ))}
          {secondaryLabel &&
            (secondaryTo ? (
              <Link className="btn btn-ghost" to={secondaryTo}>
                {secondaryLabel}
              </Link>
            ) : null)}
        </div>
      )}
    </div>
  );
}

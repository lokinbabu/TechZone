import { StarSolid, StarHalf } from './Icons';

export default function Rating({ value = 0, numReviews, size = 15, showValue = true, compact = false }) {
  const rating = Number(value) || 0;
  const rounded = Math.round(rating * 2) / 2;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rounded >= i) {
      stars.push(<StarSolid key={i} size={size} className="star star-full" />);
    } else if (rounded >= i - 0.5) {
      stars.push(<StarHalf key={i} size={size} className="star star-half" />);
    } else {
      stars.push(<StarSolid key={i} size={size} className="star star-empty" />);
    }
  }

  return (
    <span className={`rating ${compact ? 'rating-compact' : ''}`} title={`${rating.toFixed(1)} out of 5`}>
      <span className="rating-stars">{stars}</span>
      {showValue && <span className="rating-value">{rating.toFixed(1)}</span>}
      {numReviews !== undefined && !compact && <span className="rating-count">({numReviews})</span>}
    </span>
  );
}

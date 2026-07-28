import { Star, StarHalf } from "lucide-react";

export default function StarDisplay({ rating, numReviews = 0, size = 14, showText = true }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<Star key={i} size={size} className="fill-amber-400 text-amber-400" />);
    } else if (i === fullStars && hasHalfStar) {
      stars.push(<StarHalf key={i} size={size} className="fill-amber-400 text-amber-400" />);
    } else {
      stars.push(<Star key={i} size={size} className="fill-stone-200 text-stone-200" />);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">{stars}</div>
      {showText && (
        <span className="text-xs text-stone-400 font-medium">
          {rating.toFixed(1)} <span className="font-normal text-stone-300">({numReviews} review{numReviews !== 1 ? 's' : ''})</span>
        </span>
      )}
    </div>
  );
}

import { useState } from 'react';

const ComplaintRating = ({ rating, onRate, disabled = false }) => {
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleRate = (star) => {
    if (disabled) return;
    onRate(star);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRate(star)}
            onMouseEnter={() => !disabled && setHoveredStar(star)}
            onMouseLeave={() => !disabled && setHoveredStar(0)}
            disabled={disabled}
            className={`focus:outline-none transition-all ${
              disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-110'
            }`}
          >
            <svg
              className={`w-8 h-8 transition-colors ${
                star <= (hoveredStar || rating || 0)
                  ? 'text-amber-500 fill-amber-500'
                  : 'text-gray-300 fill-gray-300'
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
      {!disabled && (
        <p className="text-xs text-gray-600">
          {rating > 0 ? `You rated ${rating} out of 5 stars` : 'Click a star to rate'}
        </p>
      )}
    </div>
  );
};

export default ComplaintRating;

import { BsStarFill, BsStarHalf, BsStar } from "react-icons/bs";

/**
 * Stars Component
 *
 * @param {number} rating - The rating value (e.g., 4.5)
 * @param {number} nbStars - Total number of stars to display (default: 5)
 * @param {number|string} size - Size of the stars (default: 20)
 * @param {string} className - Additional CSS classes
 * @param {string} color - Color for filled stars (default: 'text-yellow-400')
 * @param {string} emptyColor - Color for empty stars (default: 'text-gray-300')
 * @param {boolean} showHalfStars - Whether to show half stars (default: true)
 * @param {object} ...props - Other props to pass to the container
 */
function Stars({
                 rating = 0,
                 nbStars = 5,
                 size = 20,
                 className = "",
                 color = "text-yellow-400",
                 emptyColor = "text-gray-300",
                 showHalfStars = true,
                 ...props
               }) {
  // Ensure rating is within valid range
  const normalizedRating = Math.max(0, Math.min(rating, nbStars));

  // Calculate full stars, half star, and empty stars
  const fullStars = Math.floor(normalizedRating);
  const hasHalfStar = showHalfStars && normalizedRating % 1 >= 0.5;
  const emptyStars = nbStars - fullStars - (hasHalfStar ? 1 : 0);

  return (
      <div
          className={`flex items-center gap-0.5 ${className}`}
          role="img"
          aria-label={`Rating: ${normalizedRating} out of ${nbStars} stars`}
          {...props}
      >
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, index) => (
            <BsStarFill
                key={`full-${index}`}
                size={size}
                className={color}
                aria-hidden="true"
            />
        ))}

        {/* Half star */}
        {hasHalfStar && (
            <BsStarHalf size={size} className={color} aria-hidden="true" />
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, index) => (
            <BsStar
                key={`empty-${index}`}
                size={size}
                className={emptyColor}
                aria-hidden="true"
            />
        ))}
      </div>
  );
}

export default Stars;
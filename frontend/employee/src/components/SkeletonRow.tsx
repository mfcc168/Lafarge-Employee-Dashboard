/**
 * SkeletonRow Component
 * 
 * A loading placeholder component that displays animated skeleton rows to indicate content is loading.
 * 
 * Features:
 * - Customizable number of columns (default: 3)
 * - Responsive width distribution for different column counts
 * - Smooth shimmer animation effect
 * - Accessibility considerations for loading states
 * 
 * @param {Object} props - Component props
 * @param {number} [props.columns=3] - Number of skeleton columns to display
 * returns A table row with skeleton loading placeholders
 */
const SkeletonRow = ({ columns = 3 }: { columns?: number }) => {
  // Width distribution for different column configurations
  const widths = columns === 4
    ? ['30%', '40%', '50%', '45%']  // Widths for 4-column layout
    : ['30%', '45%', '55%'];        // Default widths for 3-column layout

  return (
    <tr 
      className="animate-pulse"
      aria-hidden="true"  // Hide from screen readers during loading
    >
      {[...Array(columns)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          {/* 
            Skeleton bar with gradient animation
            - Uses a subtle gradient for better visual appeal
            - Responsive width based on column position
            - maxWidth ensures it doesn't overflow on small screens
          */}
          <div
            className="h-5 rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shadow-inner"
            style={{ 
              width: widths[i] || '50%',  // Fallback width if index is out of bounds
              maxWidth: '100%'            // Prevent overflow
            }}
          />
        </td>
      ))}
    </tr>
  );
};

export default SkeletonRow;
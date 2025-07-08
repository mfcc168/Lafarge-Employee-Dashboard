
/**
 * LoadingSpinner Component
 * 
 * Displays a centered animated loading spinner with:
 * - Gray border for the base
 * - Blue accent for the spinning animation
 * - Full viewport height centering
 * 
 * returns a spinning loader indicator
 */
const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner;

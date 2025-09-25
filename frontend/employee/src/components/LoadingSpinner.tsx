
/**
 * LoadingSpinner Component
 * 
 * Displays a beautiful animated loading spinner with:
 * - Primary brand colors with gradient effects
 * - Smooth scaling animation
 * - Multiple spinner options
 * - Enhanced visual appeal
 * 
 * @param variant - Spinner style variant (default, dots, pulse)
 * @param size - Size of the spinner (sm, md, lg)
 * @param message - Optional loading message
 * returns Enhanced spinning loader indicator
 */

interface LoadingSpinnerProps {
  variant?: 'default' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const LoadingSpinner = ({ 
  variant = 'default', 
  size = 'md', 
  message 
}: LoadingSpinnerProps = {}) => {
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16', 
    lg: 'w-24 h-24'
  };

  const dotSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  if (variant === 'dots') {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4 animate-fadeIn">
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${dotSizeClasses[size]} bg-primary-500 rounded-full animate-bounce`}
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
        {message && (
          <p className="text-gray-600 text-sm font-medium animate-pulse">{message}</p>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4 animate-fadeIn">
        <div className={`${sizeClasses[size]} bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full animate-pulseScale shadow-glow`} />
        {message && (
          <p className="text-gray-600 text-sm font-medium animate-pulse">{message}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center h-screen space-y-4 animate-fadeIn">
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full`} />
        
        {/* Spinning gradient ring */}
        <div className={`${sizeClasses[size]} border-4 border-transparent border-t-primary-500 border-r-secondary-500 rounded-full animate-spin absolute top-0 left-0`} />
        
        {/* Inner glow effect */}
        <div className={`${sizeClasses[size]} border-2 border-transparent border-t-primary-300 rounded-full animate-spinReverse absolute top-1 left-1`} style={{ width: 'calc(100% - 8px)', height: 'calc(100% - 8px)' }} />
      </div>
      
      {message && (
        <p className="text-gray-600 text-sm font-medium animate-pulse mt-4">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;

import { MonthNavigatorProps } from "@interfaces/index";


const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function MonthlyNavigator({ year, month, canGoPrevious, canGoNext, onNavigate }: MonthNavigatorProps) {
  return (
    <div className="flex justify-center items-center mb-6">
      <div className="flex items-center space-x-4 text-center">
        {canGoPrevious && (
          <button
            onClick={() => onNavigate(-1)}
            className="flex items-center justify-center p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
            aria-label="Previous month"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        <div className="text-center min-w-[200px]">
          <h2 className="text-xl font-semibold text-gray-700">
            {monthNames[month - 1]} {year}
          </h2>
        </div>

        {canGoNext && (
          <button
            onClick={() => onNavigate(1)}
            className="flex items-center justify-center p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
            aria-label="Next month"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Sidebar Skeleton Loader
 * Provides immediate visual feedback while user data is loading
 */
const SidebarSkeleton = () => {
  return (
    <div className="flex">
      {/* Desktop Sidebar Skeleton */}
      <aside className="bg-gray-900 w-60 hidden lg:flex flex-col h-screen fixed left-0 top-0 shadow-lg z-999 px-6 py-8">
        <h1 className="text-white text-2xl font-bold mb-10">Dashboard</h1>
        <ul className="space-y-6">
          {/* Render 5 skeleton items */}
          {[...Array(5)].map((_, index) => (
            <li key={index}>
              <div className="flex items-center gap-4 px-3 py-2 rounded-lg animate-pulse">
                {/* Icon skeleton */}
                <div className="w-5 h-5 bg-gray-700 rounded"></div>
                {/* Text skeleton */}
                <div className="h-4 bg-gray-700 rounded w-20"></div>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* Mobile Bottom Navigation Skeleton */}
      <nav className="lg:hidden bg-gray-900 shadow-inner fixed bottom-0 w-full z-50 flex justify-around py-3">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex flex-col items-center animate-pulse">
            <div className="w-5 h-5 bg-gray-700 rounded mb-1"></div>
            <div className="h-3 bg-gray-700 rounded w-12"></div>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default SidebarSkeleton;
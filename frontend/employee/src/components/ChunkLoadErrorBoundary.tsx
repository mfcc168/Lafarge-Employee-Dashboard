import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary specifically for handling chunk loading errors
 * in production deployments with lazy-loaded components
 */
class ChunkLoadErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a chunk loading error
    const isChunkLoadError = 
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk') ||
      error.message.includes('dynamically imported module') ||
      error.message.includes('Failed to fetch');

    if (isChunkLoadError) {
      return { hasError: true, error };
    }

    // Re-throw non-chunk errors
    throw error;
  }

  componentDidCatch(error: Error) {
    console.error('Chunk loading error:', error);
    
    // Optionally report to error tracking service
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // Example: Google Analytics event
      (window as any).gtag('event', 'exception', {
        description: `Chunk Load Error: ${error.message}`,
        fatal: false,
      });
    }
  }

  private handleRetry = () => {
    // Clear the error state and reload the page to get fresh chunks
    this.setState({ hasError: false });
    
    // Small delay to ensure state is cleared
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Loading Error
              </h2>
              
              <p className="text-gray-600 mb-6">
                Failed to load the page component. This might be due to a deployment update. 
                Please refresh the page to get the latest version.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Refresh Page
                </button>
                
                <button
                  onClick={() => window.history.back()}
                  className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Go Back
                </button>
              </div>
              
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono text-gray-700 overflow-x-auto">
                  {this.state.error?.message || 'Unknown chunk loading error'}
                </div>
              </details>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ChunkLoadErrorBoundary;
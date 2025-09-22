/**
 * Enhanced lazy import with retry logic for chunk loading failures
 * This helps handle cases where chunks fail to load due to deployment updates
 */

interface RetryConfig {
  maxRetries: number;
  delay: number;
  backoff: boolean;
}

const defaultConfig: RetryConfig = {
  maxRetries: 3,
  delay: 1000,
  backoff: true,
};

/**
 * Creates a retry wrapper for lazy imports
 * @param importFn The import function to retry
 * @param config Retry configuration
 */
export const retryLazyImport = <T>(
  importFn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): (() => Promise<T>) => {
  const { maxRetries, delay, backoff } = { ...defaultConfig, ...config };

  return async (): Promise<T> => {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await importFn();
      } catch (error) {
        lastError = error as Error;
        
        console.warn(`Lazy import attempt ${attempt + 1} failed:`, error);

        // Check if this is a chunk loading error
        const isChunkError = 
          error instanceof Error && (
            error.name === 'ChunkLoadError' ||
            error.message.includes('Loading chunk') ||
            error.message.includes('dynamically imported module') ||
            error.message.includes('Failed to fetch')
          );

        // If it's not a chunk error, fail immediately
        if (!isChunkError) {
          throw error;
        }

        // If we've exhausted retries, throw the last error
        if (attempt >= maxRetries) {
          console.error(`Failed to load chunk after ${maxRetries + 1} attempts`, error);
          throw lastError;
        }

        // Calculate delay with optional backoff
        const currentDelay = backoff ? delay * Math.pow(2, attempt) : delay;
        
        console.log(`Retrying lazy import in ${currentDelay}ms...`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, currentDelay));
      }
    }

    throw lastError!;
  };
};

/**
 * Pre-configured retry function for standard use cases
 */
export const retryChunkImport = <T>(importFn: () => Promise<T>) =>
  retryLazyImport(importFn, {
    maxRetries: 2,
    delay: 500,
    backoff: true,
  });

/**
 * Utility to preload a chunk with retry logic
 * Useful for preloading critical routes
 */
export const preloadChunk = async <T>(
  importFn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T | null> => {
  try {
    const retryImport = retryLazyImport(importFn, config);
    return await retryImport();
  } catch (error) {
    console.warn('Failed to preload chunk:', error);
    return null;
  }
};

/**
 * Create a chunk loading error for testing
 * Only available in development
 */
export const simulateChunkError = () => {
  if (process.env.NODE_ENV === 'development') {
    throw new Error('Loading chunk failed.');
  }
};
import {QueryClient} from '@tanstack/react-query';

/**
 * Default query client configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache time: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Background refetch: 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests up to 3 times
      retry: 3,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Refetch on mount if data is stale
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});

/**
 * Query client configuration for development
 */
export const devQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Shorter cache times for development
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 2 * 60 * 1000, // 2 minutes
      retry: 1,
      retryDelay: 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,
      retryDelay: 1000,
    },
  },
});

// Singleton instances
let _queryClient: QueryClient | null = null;
let _devQueryClient: QueryClient | null = null;

/**
 * Get the appropriate query client based on environment
 */
export function getQueryClient() {
  if (process.env.NODE_ENV === 'development') {
    if (!_devQueryClient) {
      _devQueryClient = devQueryClient;
    }
    return _devQueryClient;
  }

  if (!_queryClient) {
    _queryClient = queryClient;
  }
  return _queryClient;
}

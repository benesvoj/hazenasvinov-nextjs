import {QueryClient} from '@tanstack/react-query';

/**
 * Server-side and client-side query client factory
 *
 * Creates separate QueryClient instances for server and browser:
 * - Server: New instance per request (prevents data leaking between users)
 * - Browser: Single instance (maintains cache across renders)
 */

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  // Server: Always create a new query client for each request
  // This prevents data from one user's request leaking to another
  if (typeof window === 'undefined') {
    return new QueryClient({
      defaultOptions: {
        queries: {
          // Server queries don't need to refetch
          staleTime: 60 * 1000, // 1 minute
        },
      },
    });
  }

  // Browser: Reuse the same query client across renders
  // This maintains the cache between renders
  if (!browserQueryClient) {
    browserQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // Consider data fresh for 1 minute
          gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
        },
      },
    });
  }

  return browserQueryClient;
}

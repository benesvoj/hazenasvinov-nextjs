'use client';

import {useCallback, useEffect, useState, useRef} from 'react';

import {showToast} from '@/components';

export interface DataFetchHookConfig {
  /** API endpoint to fetch from */
  endpoint: string;
  /** Entity name for error messages (e.g., "committees", "members") */
  entityName: string;
  /** Error message for failed fetch */
  errorMessage: string;
  /** Whether to fetch on mount (default: true) */
  fetchOnMount?: boolean;
  /** Whether to show toast on error (default: true) */
  showErrorToast?: boolean;
}

export interface DataFetchHookResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Factory function to create data fetching hooks with loading and error states
 *
 * @architectural-layer Data Access Layer
 * @see {@link https://github.com/anthropics/claude-code/blob/main/docs/architecture/LAYERED_ARCHITECTURE.md}
 * @see {@link https://github.com/anthropics/claude-code/blob/main/docs/architecture/FACTORY_PATTERNS.md}
 *
 * @description
 * Creates a custom hook that:
 * - Fetches data from an API endpoint
 * - Manages loading and error states
 * - Automatically fetches on mount (configurable)
 * - Provides a refetch function
 * - Cancels pending requests on unmount
 * - Shows error toasts (configurable)
 *
 * @template T - The type of data being fetched
 *
 * @param config - Configuration for the data fetch hook
 * @param config.endpoint - API endpoint URL to fetch from
 * @param config.entityName - Entity name for error messages (e.g., "videos", "matches")
 * @param config.errorMessage - Error message to display on failure
 * @param config.fetchOnMount - Whether to automatically fetch on mount (default: true)
 * @param config.showErrorToast - Whether to show error toasts (default: true)
 *
 * @returns A custom hook that returns data, loading state, error, and refetch function
 *
 * @example
 * // Basic usage
 * const useFetchVideos = createDataFetchHook<VideoSchema>({
 *   endpoint: API_ROUTES.entities.root('videos'),
 *   entityName: 'videos',
 *   errorMessage: 'Failed to fetch videos'
 * });
 *
 * // In component
 * function VideosPage() {
 *   const {data: videos, loading, error, refetch} = useFetchVideos();
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error} />;
 *
 *   return <VideoGrid videos={videos} onRefresh={refetch} />;
 * }
 *
 * @example
 * // With custom options
 * const useFetchVideos = createDataFetchHook<VideoSchema>({
 *   endpoint: API_ROUTES.entities.root('videos'),
 *   entityName: 'videos',
 *   errorMessage: 'Failed to fetch videos',
 *   fetchOnMount: false,      // Don't fetch automatically
 *   showErrorToast: false      // Handle errors manually
 * });
 *
 * @architectural-usage
 * ✅ Use when:
 * - Fetching lists of entities from API
 * - Need consistent loading/error handling
 * - Want automatic cleanup on unmount
 *
 * ❌ Don't use when:
 * - Implementing filtering/sorting (use business layer hooks)
 * - Managing form state (use createFormHook)
 * - Need complex multi-step fetching (write custom hook)
 *
 * @performance
 * - Automatically cancels pending requests on unmount
 * - Uses useCallback for stable refetch reference
 * - Memoizes fetch function with proper dependencies
 */
export function createDataFetchHook<T>(config: DataFetchHookConfig): () => DataFetchHookResult<T> {
  const {endpoint, entityName, errorMessage, fetchOnMount = true, showErrorToast = true} = config;

  return function useDataFetch(): DataFetchHookResult<T> {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(fetchOnMount);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchData = useCallback(async () => {
      try {
        // Cancel previous request if still pending
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);

        const res = await fetch(endpoint, {
          signal: abortControllerRef.current.signal,
        });
        const response = await res.json();

        if (!res.ok) {
          throw new Error(response.error || errorMessage);
        }

        setData(response.data || []);
      } catch (err: any) {
        // Ignore abort errors
        if (err.name === 'AbortError') {
          return;
        }

        console.error(`Error fetching ${entityName}:`, err);
        const errorMsg = err.message || errorMessage;
        setError(errorMsg);

        if (showErrorToast) {
          showToast.danger(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      if (fetchOnMount) {
        fetchData();
      }

      // Cleanup: abort pending requests on unmount
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }, [fetchData]);

    return {
      data,
      loading,
      error,
      refetch: fetchData,
    };
  };
}

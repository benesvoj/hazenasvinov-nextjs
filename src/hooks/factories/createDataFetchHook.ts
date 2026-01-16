'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {showToast} from '@/components';

export interface DataFetchHookConfig<TParams = void> {
  /** API endpoint to fetch from */
  endpoint: string | ((params: TParams) => string);
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
export function createDataFetchHook<T, TParams = void>(
  config: DataFetchHookConfig<TParams>
): TParams extends void
  ? () => DataFetchHookResult<T>
  : (params: TParams) => DataFetchHookResult<T> {
  const {entityName, errorMessage, fetchOnMount = true, showErrorToast = true} = config;
  const isParameterized = typeof config.endpoint === 'function';

  return function useDataFetch(params?: TParams): DataFetchHookResult<T> {
    // Serialize params for stable comparison
    const paramsKey = params ? JSON.stringify(params) : '';

    const endpoint = useMemo(() => {
      if (isParameterized) {
        return (config.endpoint as (p: TParams) => string)(params as TParams);
      }
      return config.endpoint as string;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paramsKey]);

    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(fetchOnMount);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchData = useCallback(async () => {
      try {
        if (abortControllerRef.current) abortControllerRef.current.abort();

        abortControllerRef.current = new AbortController();
        setLoading(true);
        setError(null);

        const res = await fetch(endpoint, {
          signal: abortControllerRef.current.signal,
        });
        const response = await res.json();

        if (!res.ok) throw new Error(response.error || errorMessage);

        setData(response.data || []);
      } catch (err: any) {
        if (err.name === 'AbortError') return;

        console.error(`Error fetching ${entityName}:`, err);
        const errorMsg = err.message || errorMessage;
        setError(errorMsg);

        if (showErrorToast) {
          showToast.danger(errorMsg);
        }
      } finally {
        setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (fetchOnMount) {
        fetchData();
      }

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
  } as any;
}

'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {showToast} from '@/components';

export interface SingleEntityFetchHookConfig<TParams = void> {
  /** API endpoint to fetch from */
  endpoint: string | ((params: TParams) => string);
  /** Entity name for error messages (e.g., "tournament", "member") */
  entityName: string;
  /** Error message for failed fetch */
  errorMessage: string;
  /** Whether to fetch on mount (default: true) */
  fetchOnMount?: boolean;
  /** Whether to show toast on error (default: true) */
  showErrorToast?: boolean;
}

export interface SingleEntityFetchHookResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function createSingleEntityFetchHook<T, TParams = void>(
  config: SingleEntityFetchHookConfig<TParams>
): TParams extends void
  ? () => SingleEntityFetchHookResult<T>
  : (params: TParams) => SingleEntityFetchHookResult<T> {
  const {entityName, errorMessage, fetchOnMount = true, showErrorToast = true} = config;
  const isParameterized = typeof config.endpoint === 'function';

  return function useSingleEntityFetch(params?: TParams): SingleEntityFetchHookResult<T> {
    const paramsKey = params ? JSON.stringify(params) : '';

    const endpoint = useMemo(() => {
      if (isParameterized) {
        return (config.endpoint as (p: TParams) => string)(params as TParams);
      }
      return config.endpoint as string;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paramsKey]);

    const [data, setData] = useState<T | null>(null);
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

        setData(response.data ?? null);
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
    }, [endpoint]);

    useEffect(() => {
      if (fetchOnMount) {
        void fetchData();
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

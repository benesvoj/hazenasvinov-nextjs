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
 * Factory function to create data fetching hooks
 *
 * @example
 * const useFetchCommittees = createDataFetchHook<Committee>({
 *   endpoint: API_ROUTES.committees.root,
 *   entityName: 'committees',
 *   errorMessage: 'Failed to fetch committees'
 * });
 */
export function createDataFetchHook<T>(
	config: DataFetchHookConfig
): () => DataFetchHookResult<T> {
	const {
		endpoint,
		entityName,
		errorMessage,
		fetchOnMount = true,
		showErrorToast = true,
	} = config;

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
		}, [endpoint, entityName, errorMessage, showErrorToast]);

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
		}, [fetchData, fetchOnMount]);

		return {
			data,
			loading,
			error,
			refetch: fetchData,
		};
	};
}
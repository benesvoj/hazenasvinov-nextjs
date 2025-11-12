'use client';

import {useCallback, useEffect, useState} from 'react';

import {showToast} from "@/components";
import {API_ROUTES} from '@/lib';
import {Season} from '@/types';

export function useFetchSeasons() {
	const [data, setData] = useState<Season[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const fetchData = useCallback(
		async () => {
			setLoading(true);
			setError(null);

			try {
				const res = await fetch(API_ROUTES.seasons.root);
				const response = await res.json();

				setData(response.data || []);
			} catch (err) {
				console.error('Failed to fetch data', err);
				setError(err instanceof Error ? err : new Error('Unknown error'));
				showToast.danger('Failed to fetch seasons');
			} finally {
				setLoading(false);
			}
		}, [])

	useEffect(() => {
		fetchData();
	}, []);

	return {
		data,
		loading,
		error,
		refetch: fetchData,
	};
}

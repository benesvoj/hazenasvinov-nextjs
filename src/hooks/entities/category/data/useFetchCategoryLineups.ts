'use client';

import {useEffect, useState} from "react";

import {showToast} from "@/components";
import {API_ROUTES} from "@/lib";
import {CategoryLineup} from "@/types";

export function useFetchCategoryLineups(categoryId: string, seasonId: string) {
	const [data, setData] = useState<CategoryLineup[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		try {
			setLoading(true);
			setError(null);

			const res = await fetch(API_ROUTES.categories.lineups(categoryId) + `?season_id=${seasonId}&is_active=true`);
			const response = await res.json();

			if (!res.ok || response.error) {
				throw new Error(response.error || 'Failed to fetch lineups');
			}

			setData(response.data || []);
		} catch (error) {
			console.error('Failed to fetch category lineups', error);
			setError('Failed to fetch category lineups');
			showToast.danger('Failed to fetch category lineups');
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		if (categoryId && seasonId) {
			fetchData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [categoryId, seasonId]);


	return {
		data,
		loading,
		error,
		refetch: fetchData,
	};
}
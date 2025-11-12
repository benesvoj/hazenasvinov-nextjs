'use client';

import {useCallback, useEffect, useState} from "react";

import {API_ROUTES} from "@/lib";
import {CategoryLineupMemberWithMember} from "@/types";

export const useFetchCategoryLineupMembers = (
	categoryId: string,
	categoryLineupId: string,
) => {
	const [data, setData] = useState<CategoryLineupMemberWithMember[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		if (!categoryLineupId || !categoryId) {
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const res = await fetch(API_ROUTES.categories.lineupByIdMembers(categoryId, categoryLineupId));
			const response = await res.json();

			if (!res.ok || response.error) {
				throw new Error(response.error || 'Failed to fetch lineup members');
			}

			setData(response.data || []);
		} catch (error) {
			console.error('Failed to fetch category lineup members', error);
			setError('Failed to fetch category lineup members');
		} finally {
			setLoading(false);
		}
	}, [categoryLineupId, categoryId]);

	useEffect(() => {
		void fetchData();
	}, [fetchData]);

	return {
		data,
		loading,
		error,
		refetch: fetchData,
	};
}
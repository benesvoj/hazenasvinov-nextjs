'use client';

import {useCallback, useEffect, useState} from 'react';

import {showToast} from "@/components";
import {API_ROUTES, translations} from '@/lib';
import {MemberFunction} from '@/types';

const t = translations.common.responseMessage;

export function useFetchMemberFunctions() {
	const [data, setData] = useState<MemberFunction[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const res = await fetch(API_ROUTES.memberFunctions.root, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});
			const response = await res.json();

			if (!res.ok || response.error) {
				throw new Error(response.error || t.failedToFetchData);
			}

			setData(response.data || []);

		} catch (error) {
			const message = error instanceof Error ? error.message : t.unknownError;
			setError(message);
			showToast.danger(t.failedToFetchData);
			throw error;

		} finally {
			setLoading(false);
		}
	}, []);


	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return {
		data,
		loading,
		error,
		refetch: fetchData,
	};
}

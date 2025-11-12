'use client';

import {useCallback, useEffect, useState} from 'react';

import {showToast} from "@/components";
import {API_ROUTES} from "@/lib";
import {Member} from '@/types';

export function useFetchMembers() {
	const [data, setData] = useState<Member[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(
		async () => {
			try {
				setLoading(true);
				setError(null);

				const res = await fetch(API_ROUTES.members.root);
				const response = await res.json();

				setData(response.data || []);
			} catch (error) {
				console.error('Error fetching members', error);
				setError('Error fetching members');
				showToast.danger('Error fetching members');
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

import {useCallback, useEffect, useState} from "react";

import {showToast} from "@/components";
import {API_ROUTES} from "@/lib";
import {ClubConfig} from "@/types";

export function useFetchClubConfig() {
	const [data, setData] = useState<ClubConfig | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(
		async () => {
			try {
				setLoading(true);
				setError(null);

				const res = await fetch(API_ROUTES.clubConfig.root);
				const response = await res.json();

				setData(response.data || null);
			} catch (error) {
				console.error('Failed to fetch club configuration', error);
				setError('Failed to fetch club configuration');
				showToast.danger('Failed to fetch club configuration');
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
	}
}


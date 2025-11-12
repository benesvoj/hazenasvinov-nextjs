'use client';

import {useCallback, useEffect, useState} from "react";

import {showToast} from "@/components";
import {API_ROUTES} from "@/lib";
import {BaseComment} from "@/types";

export function useFetchComments(options?: { enabled?: boolean }) {
	const enabled = options?.enabled ?? true;
	const [data, setData] = useState<BaseComment[]>([]);
	const [loading, setLoading] = useState<boolean>(false);

	const fetchData = useCallback(
		async () => {
			setLoading(true);

			try {
				const res = await fetch(API_ROUTES.comments.root)
				const response = await res.json();
				setData(response.data || []);
			} catch (error) {
				console.error(error);
				showToast.danger('Failed to fetch comments');
				setData([]);
			} finally {
				setLoading(false);
			}
		}, []);

	useEffect(() => {
		if( enabled) {
			fetchData()
		}
	}, []);

	return {
		data,
		loading,
		refetch: fetchData,
	}
}
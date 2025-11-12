'use client';

import {useCallback, useEffect, useState} from "react";

import {showToast} from "@/components";
import {API_ROUTES} from "@/lib";
import {TodoItem} from "@/types";

export function useFetchTodos(options?: { enabled?: boolean }) {
	const enabled = options?.enabled ?? true;
	const [data, setData] = useState<TodoItem[] | null>(null);
	const [loading, setLoading] = useState(false);

	const fetchData = useCallback(
		async () => {
			setLoading(true);

			try {
				const res = await fetch(API_ROUTES.todos.root)
				const response = await res.json();
				setData(response.data || []);
			} catch (error) {
				console.error(error);
				showToast.danger('Failed to fetch todos');
				setData([]);
			} finally {
				setLoading(false);
			}
		}, [])

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
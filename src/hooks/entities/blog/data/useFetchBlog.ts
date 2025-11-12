'use client';

import {useCallback, useEffect, useState} from "react";

import {showToast} from "@/components";
import {API_ROUTES} from "@/lib";
import {Blog} from "@/types";

/**
 *  Custom hook to fetch blog posts from the API.
 * @param options
 * @returns {{data: Blog[]; loading: boolean; refetch: () => Promise<void>}}
 * @todo Rename to useFetchBlogPosts for clarity after deprecating old hook.
 */
export function useFetchBlog(options?: { enabled?: boolean }) {
	const enabled = options?.enabled ?? true;
	const [data, setData] = useState<Blog[]>([]);
	const [loading, setLoading] = useState<boolean>(false);

	const fetchData = useCallback(
		async () => {
			setLoading(true);
			console.log('🔍 useFetchBlog - Starting fetch...');

			try {
				const res = await fetch(API_ROUTES.blog.root);
				const response = await res.json();
				setData(response.data || []);
			} catch (error) {
				showToast.danger('Failed to fetch blog posts');
				setData([]);
			} finally {
				setLoading(false);
			}
		}, [])

	useEffect(() => {
		if (enabled) {
			fetchData()
		}
	}, [enabled, fetchData]);

	return {
		data,
		loading,
		refetch: fetchData,
	};
}
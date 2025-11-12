import {useMemo} from "react";

import {createSearchablePost, searchPosts} from "@/utils/contentSearch";

import {statusFilterToDbValue} from "@/constants";
import {useDebounce} from "@/hooks";
import {Blog, Category} from "@/types";


interface BlogPostFilteringProps {
	blogPosts: Blog[];
	searchTerm: string;
	statusFilter: string;
	categories: Category[];
}

export const useBlogPostFiltering = ({
										 blogPosts,
										 searchTerm,
										 statusFilter,
										 categories
									 }: BlogPostFilteringProps) => {

	const debouncedSearchTerm = useDebounce(searchTerm, 300);

	// Create searchable posts with content excerpts
	const searchablePosts = useMemo(() => blogPosts.map(createSearchablePost), [blogPosts]);

	// Memoized category lookup map for performance
	const categoryLookupMap = useMemo(() => {
		const map = new Map();
		categories.forEach((category) => {
			map.set(category.id, category.name);
		});
		return map;
	}, [categories]);

	// Filter posts based on debounced search and status
	const filteredPosts = useMemo(() => {
		return searchablePosts.filter((post) => {
			const matchesSearch = searchPosts([post], debouncedSearchTerm).length > 0;
			const dbStatusValue =
				statusFilterToDbValue[statusFilter as keyof typeof statusFilterToDbValue];
			const matchesStatus = statusFilter === 'all' || post.status === dbStatusValue;
			return matchesSearch && matchesStatus;
		});
	}, [searchablePosts, debouncedSearchTerm, statusFilter]);

	// Calculate statistics
	const stats = useMemo(() => {
		const total = blogPosts.length;
		const published = blogPosts.filter(p => p.status === 'published').length;
		const draft = blogPosts.filter(p => p.status === 'draft').length;
		const archived = blogPosts.filter(p => p.status === 'archived').length;

		return {
			total,
			published,
			draft,
			archived,
			filtered: filteredPosts.length
		};
	}, [blogPosts, filteredPosts]);

	return {
		filteredPosts,
		categoryLookupMap,
		debouncedSearchTerm,
		stats
	}
}
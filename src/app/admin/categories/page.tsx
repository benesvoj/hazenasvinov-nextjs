import {HydrationBoundary} from '@tanstack/react-query';

import {prefetchQuery} from '@/utils/prefetch';

import {fetchCategories} from '@/queries/categories/queries';

import {CategoriesPageClient} from './CategoriesPageClient';

export default async function CategoriesAdminPage() {
	const dehydratedState = await prefetchQuery(['categories'], fetchCategories);
	return (
		<HydrationBoundary state={dehydratedState}>
			<CategoriesPageClient/>
		</HydrationBoundary>
	);
}

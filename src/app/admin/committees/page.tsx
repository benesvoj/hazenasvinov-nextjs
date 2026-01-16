import {HydrationBoundary} from '@tanstack/react-query';

import {prefetchQuery} from '@/utils/prefetch';

import {fetchCommittees} from '@/queries/committees/queries';

import {CommitteesPageClient} from './CommitteesPageClient';

export default async function CommitteesAdminPage() {
  const dehydratedState = await prefetchQuery(['committees'], fetchCommittees);

  return (
    <HydrationBoundary state={dehydratedState}>
      <CommitteesPageClient />
    </HydrationBoundary>
  );
}
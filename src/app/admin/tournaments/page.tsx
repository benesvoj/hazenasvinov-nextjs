import {HydrationBoundary} from '@tanstack/react-query';

import {prefetchQuery} from '@/utils/prefetch';

import {fetchTournaments} from '@/queries/tournaments';

import TournamentsPageClient from './TournamentsPageClient';

export default async function TournamentsPage() {
  const dehydratedState = await prefetchQuery(['tournaments'], fetchTournaments);

  return (
    <HydrationBoundary state={dehydratedState}>
      <TournamentsPageClient />
    </HydrationBoundary>
  );
}

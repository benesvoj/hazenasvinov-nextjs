import {HydrationBoundary} from '@tanstack/react-query';

import {prefetchQuery} from '@/utils/prefetch';

import {fetchSeasons} from '@/queries/seasons/queries';

import {SeasonsPageClient} from './SeasonsPageClient';

export default async function SeasonsAdminPage() {
  const dehydratedState = await prefetchQuery(['seasons'], fetchSeasons);

  return (
    <HydrationBoundary state={dehydratedState}>
      <SeasonsPageClient />
    </HydrationBoundary>
  );
}

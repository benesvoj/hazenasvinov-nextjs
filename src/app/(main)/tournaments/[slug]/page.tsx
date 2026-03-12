import {notFound} from 'next/navigation';

import {HydrationBoundary} from '@tanstack/react-query';

import {prefetchQuery} from '@/utils/prefetch';

import {fetchTournamentPageData} from '@/queries/tournaments';

import TournamentPageClient from './TournamentPageClient';

interface TournamentPageProps {
  params: Promise<{slug: string}>;
}

export default async function TournamentPage({params}: TournamentPageProps) {
  const {slug} = await params;

  if (!slug?.trim()) {
    notFound();
  }

  let dehydratedState;
  try {
    dehydratedState = await prefetchQuery(['tournament', slug], () =>
      fetchTournamentPageData(slug)
    );
  } catch {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydratedState}>
      <TournamentPageClient slug={slug} />
    </HydrationBoundary>
  );
}

export async function generateStaticParams() {
  const {default: supabaseAdmin} = await import('@/utils/supabase/admin');

  const {data: tournaments} = await supabaseAdmin
    .from('tournaments')
    .select('slug')
    .eq('status', 'published')
    .order('start_date', {ascending: false})
    .limit(20);

  return tournaments?.map((t) => ({slug: t.slug})) || [];
}

// ISR: revalidate every hour (same as blog posts)
export const revalidate = 3600;

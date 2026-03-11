# Phase 5 — Public / Blog

> **Estimate:** 2–3 MD | **Depends on:** Phase 2–4 | **Milestone:** Public can view published tournament
>
> Parent: [Tournaments_Analysis_Report.md](Tournaments_Analysis_Report.md)

---

## Checklist

- [ ] 5.1 Public tournament page: `(main)/tournaments/[slug]/page.tsx`
- [ ] 5.2 API route for public tournament fetch
- [ ] 5.3 Homepage teaser component
- [ ] 5.4 `TournamentEmbed` component for blog pages
- [ ] 5.5 Blog post integration (detect linked tournament)
- [ ] 5.6 `generateStaticParams` + ISR config
- [ ] 5.7 Verify: public page renders, SEO, mobile

---

## 5.1 Public tournament page (1.0 MD)

### File structure

```
src/app/(main)/tournaments/
  [slug]/
    page.tsx                    ← Server component (SSR + ISR)
    TournamentPageClient.tsx    ← Client component
    components/
      TournamentHeader.tsx
      TournamentSchedule.tsx
      TournamentStandings.tsx
      TournamentBlogLink.tsx
      index.ts
```

### `page.tsx` — Server component

**Reference:** `src/app/(main)/blog/[slug]/page.tsx` and `src/app/(main)/categories/[slug]/page.tsx`

```typescript
import {notFound} from 'next/navigation';
import {HydrationBoundary} from '@tanstack/react-query';
import {prefetchQuery} from '@/utils/prefetch';
import {fetchTournamentBySlug} from '@/queries/tournaments';
import TournamentPageClient from './TournamentPageClient';

interface TournamentPageProps {
  params: Promise<{slug: string}>;
}

export default async function TournamentPage({params}: TournamentPageProps) {
  const {slug} = await params;

  if (!slug?.trim()) {
    notFound();
  }

  try {
    const dehydratedState = await prefetchQuery(
      ['tournament', slug],
      () => fetchTournamentBySlug(slug)
    );

    return (
      <HydrationBoundary state={dehydratedState}>
        <TournamentPageClient slug={slug} />
      </HydrationBoundary>
    );
  } catch {
    notFound();
  }
}

// ISR: revalidate every hour (same as blog posts)
export const revalidate = 3600;
```

### `TournamentPageClient.tsx` — Client component

```typescript
'use client';

import {TournamentHeader, TournamentSchedule, TournamentStandings, TournamentBlogLink} from './components';

interface TournamentPageClientProps {
  slug: string;
}

export default function TournamentPageClient({slug}: TournamentPageClientProps) {
  // Fetch tournament data (matches, standings, teams)
  // const {tournament, matches, standings} = useTournamentPageData(slug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div className="grid grid-cols-1 gap-8">
        {/* Mobile: Standings first, Desktop: Header first */}
        <div className="order-1">
          <TournamentHeader tournament={tournament} />
        </div>

        <div className="order-2 md:order-3">
          <TournamentStandings standings={standings} />
        </div>

        <div className="order-3 md:order-2">
          <TournamentSchedule matches={matches} />
        </div>

        {tournament.post_id && (
          <div className="order-4">
            <TournamentBlogLink postId={tournament.post_id} />
          </div>
        )}
      </div>
    </div>
  );
}
```

### `TournamentHeader.tsx`

```typescript
interface TournamentHeaderProps {
  tournament: Tournament;
}

export function TournamentHeader({tournament}: TournamentHeaderProps) {
  return (
    <div className="space-y-2">
      <Heading size={1}>{tournament.name}</Heading>
      <HStack spacing={4} wrap>
        <Badge>{tournament.category?.name}</Badge>
        <span>{formatDate(tournament.start_date)}</span>
        {tournament.end_date && <span>– {formatDate(tournament.end_date)}</span>}
        {tournament.venue && <span>{tournament.venue}</span>}
      </HStack>
      {tournament.description && (
        <p className="text-gray-600 mt-4">{tournament.description}</p>
      )}
    </div>
  );
}
```

### `TournamentSchedule.tsx`

Matches grouped by round. Reuse `MatchRow` component for individual match display.

**Reference:** `src/components/shared/match/MatchSchedule.tsx`

```typescript
interface TournamentScheduleProps {
  matches: Match[];
}

export function TournamentSchedule({matches}: TournamentScheduleProps) {
  const t = translations.tournaments.public;

  const matchesByRound = useMemo(() => {
    const grouped = new Map<number, Match[]>();
    matches.forEach((match) => {
      const round = match.round ?? 0;
      if (!grouped.has(round)) grouped.set(round, []);
      grouped.get(round)!.push(match);
    });
    return Array.from(grouped.entries()).sort(([a], [b]) => a - b);
  }, [matches]);

  if (matches.length === 0) {
    return <EmptyState type="matches" title={t.noMatches} description="" />;
  }

  return (
    <ContentCard title={t.schedule}>
      <VStack spacing={6}>
        {matchesByRound.map(([round, roundMatches]) => (
          <div key={round}>
            <Heading size={3}>{`${t.round || 'Kolo'} ${round}`}</Heading>
            <VStack spacing={2}>
              {roundMatches.map((match) => (
                <MatchRow key={match.id} match={match} layout="compact" />
              ))}
            </VStack>
          </div>
        ))}
      </VStack>
    </ContentCard>
  );
}
```

### `TournamentStandings.tsx`

**Reference:** `src/app/(main)/categories/components/CategoryStandings.tsx`

```typescript
interface TournamentStandingsProps {
  standings: EnhancedStanding[];
}

export function TournamentStandings({standings}: TournamentStandingsProps) {
  const t = translations.tournaments.public;

  return (
    <UnifiedStandingTable
      standings={standings}
      loading={false}
      emptyContent={
        <EmptyState type="standings" title={t.noStandings} description="" />
      }
    />
  );
}
```

---

## 5.2 API route for public tournament fetch (0.2 MD)

**File:** `src/app/api/tournaments/by-slug/[slug]/route.ts`

**Reference:** `src/app/api/blog/by-slug/[slug]/route.ts`

```typescript
import {NextRequest} from 'next/server';
import {withPublicAccess, successResponse, errorResponse} from '@/utils/supabase/apiHelpers';

export async function GET(
  request: NextRequest,
  {params}: {params: Promise<{slug: string}>}
) {
  return withPublicAccess(async (supabase) => {
    const {slug} = await params;

    const {data: tournament, error} = await supabase
      .from('tournaments')
      .select(`
        *,
        category:categories(id, name, slug),
        season:seasons(id, name)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !tournament) {
      return errorResponse('Turnaj nenalezen', 404);
    }

    // Fetch matches and standings in parallel
    const [matchesResult, standingsResult] = await Promise.all([
      supabase
        .from('matches')
        .select(`
          *,
          home_team:club_category_teams!home_team_id(
            id, team_suffix,
            club_category:club_categories(club:clubs(id, name, short_name, logo_url))
          ),
          away_team:club_category_teams!away_team_id(
            id, team_suffix,
            club_category:club_categories(club:clubs(id, name, short_name, logo_url))
          )
        `)
        .eq('tournament_id', tournament.id)
        .order('round')
        .order('date'),
      supabase
        .from('tournament_standings')
        .select(`
          *,
          team:club_category_teams(
            id, team_suffix,
            club_category:club_categories(club:clubs(id, name, short_name, logo_url))
          )
        `)
        .eq('tournament_id', tournament.id)
        .order('position'),
    ]);

    return successResponse({
      tournament,
      matches: matchesResult.data || [],
      standings: standingsResult.data || [],
    });
  });
}
```

---

## 5.3 Homepage teaser component (0.5 MD)

**File:** `src/app/(main)/components/TournamentTeaser.tsx`

**Reference:** `src/app/(main)/components/` — follows existing homepage section pattern.

### Placement

**File:** `src/app/(main)/page.tsx`

Add between existing sections (e.g., after `LatestResultsSection` or `PostSection`):

```typescript
{!loading && sectionVisibility.tournaments && <TournamentTeaser />}
```

Or always show if there are upcoming/recent tournaments.

### Component

```typescript
'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {TrophyIcon, CalendarIcon, MapPinIcon} from '@heroicons/react/24/outline';

import {ContentCard, HStack, VStack, Heading} from '@/components';
import {supabaseBrowserClient} from '@/utils/supabase/client';
import {translations} from '@/lib/translations';

const t = translations.tournaments.public;

interface TournamentTeaserData {
  id: string;
  name: string;
  slug: string;
  start_date: string;
  end_date: string | null;
  venue: string | null;
  category: {name: string} | null;
}

export function TournamentTeaser() {
  const [tournaments, setTournaments] = useState<TournamentTeaserData[]>([]);

  useEffect(() => {
    const fetchTournaments = async () => {
      const supabase = supabaseBrowserClient();
      const {data} = await supabase
        .from('tournaments')
        .select('id, name, slug, start_date, end_date, venue, category:categories(name)')
        .eq('status', 'published')
        .order('start_date', {ascending: false})
        .limit(3);

      if (data) setTournaments(data);
    };
    fetchTournaments();
  }, []);

  if (tournaments.length === 0) return null;

  return (
    <ContentCard
      title={t.teaser}
      icon={<TrophyIcon className="w-5 h-5 text-yellow-600" />}
    >
      <VStack spacing={4}>
        {tournaments.map((tournament) => (
          <Link
            key={tournament.id}
            href={`/tournaments/${tournament.slug}`}
            className="block p-4 rounded-lg border hover:bg-gray-50 transition"
          >
            <Heading size={4}>{tournament.name}</Heading>
            <HStack spacing={4} className="mt-2 text-sm text-gray-500">
              {tournament.category && <span>{tournament.category.name}</span>}
              <HStack spacing={1}>
                <CalendarIcon className="w-4 h-4" />
                <span>{formatDate(tournament.start_date)}</span>
              </HStack>
              {tournament.venue && (
                <HStack spacing={1}>
                  <MapPinIcon className="w-4 h-4" />
                  <span>{tournament.venue}</span>
                </HStack>
              )}
            </HStack>
          </Link>
        ))}
      </VStack>
    </ContentCard>
  );
}
```

---

## 5.4 `TournamentEmbed` component (0.5 MD)

**File:** `src/components/shared/tournament/TournamentEmbed.tsx`

Compact version of tournament data for embedding in blog posts.

```typescript
interface TournamentEmbedProps {
  tournamentId: string;
}

export function TournamentEmbed({tournamentId}: TournamentEmbedProps) {
  // Fetch tournament data (matches + standings)
  const [data, setData] = useState<{matches: Match[]; standings: EnhancedStanding[]} | null>(null);

  useEffect(() => {
    // Fetch matches and standings for this tournament
  }, [tournamentId]);

  if (!data) return <LoadingSpinner />;

  return (
    <div className="space-y-6 my-8 p-4 bg-gray-50 rounded-lg border">
      <HStack spacing={2}>
        <TrophyIcon className="w-5 h-5 text-yellow-600" />
        <Heading size={3}>Turnaj</Heading>
      </HStack>

      {/* Compact standings */}
      <UnifiedStandingTable
        standings={data.standings}
        responsive
      />

      {/* Compact schedule - last few results */}
      <div className="space-y-1">
        {data.matches
          .filter((m) => m.status === 'completed')
          .slice(-5)
          .map((match) => (
            <MatchRow key={match.id} match={match} layout="compact" />
          ))}
      </div>
    </div>
  );
}
```

---

## 5.5 Blog post integration (0.3 MD)

**File:** `src/app/(main)/blog/[slug]/BlogPostClient.tsx` — modify existing

### Detection logic

When rendering a blog post, check if any tournament references this post via `post_id`:

```typescript
// In BlogPostClient or its data fetching
const {data: linkedTournament} = await supabase
  .from('tournaments')
  .select('id')
  .eq('post_id', blogPost.id)
  .eq('status', 'published')
  .single();

// In render
{linkedTournament && (
  <TournamentEmbed tournamentId={linkedTournament.id} />
)}
```

### Alternative approach

Add the tournament check to `fetchBlogPostBySlug` in `src/queries/blogPosts/queries.ts` so the data is available without an extra query:

```typescript
// After fetching blog post, also check for linked tournament
const {data: tournament} = await supabase
  .from('tournaments')
  .select('id, name, slug')
  .eq('post_id', post.id)
  .eq('status', 'published')
  .maybeSingle();

return {...post, linkedTournament: tournament};
```

---

## 5.6 `generateStaticParams` + ISR (0.2 MD)

**File:** `src/app/(main)/tournaments/[slug]/page.tsx`

**Reference:** `src/app/(main)/blog/[slug]/page.tsx`

```typescript
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

export const revalidate = 3600;  // 1 hour ISR
```

**Key points:**
- Uses admin client (no cookies at build time)
- Pre-renders top 20 published tournaments
- Other slugs rendered on-demand with 1h cache
- Falls back to `notFound()` for non-existent slugs

---

## 5.7 Verification

### Visual checks

- [ ] Visit `/tournaments/{slug}` → header, schedule, standings render
- [ ] Mobile responsive: standings collapse columns, schedule stacks
- [ ] Draft tournament slug → 404
- [ ] Non-existent slug → 404
- [ ] Homepage teaser shows published tournaments

### SEO checks

- [ ] Page has proper `<title>` and meta description
- [ ] Open Graph tags present (for social sharing)
- [ ] `generateStaticParams` produces correct slugs
- [ ] ISR revalidation works (update tournament → page refreshes within 1h)

### Performance checks

- [ ] Public page loads fast (standings persisted, no recomputation)
- [ ] TournamentEmbed in blog post loads efficiently
- [ ] No N+1 queries (parallel fetches for matches + standings)

---

## Expected file tree after Phase 5

```
src/app/(main)/tournaments/
  [slug]/
    page.tsx
    TournamentPageClient.tsx
    components/
      TournamentHeader.tsx
      TournamentSchedule.tsx
      TournamentStandings.tsx
      TournamentBlogLink.tsx
      index.ts

src/app/(main)/components/
  TournamentTeaser.tsx

src/components/shared/tournament/
  TournamentEmbed.tsx

src/app/api/tournaments/
  by-slug/[slug]/route.ts

src/app/(main)/page.tsx                           ← updated (add teaser)
src/app/(main)/blog/[slug]/BlogPostClient.tsx     ← updated (embed detection)
src/queries/blogPosts/queries.ts                  ← optionally updated
```

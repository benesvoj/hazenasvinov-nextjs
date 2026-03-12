# Phase 2 — API / Hooks

> **Estimate:** 2.5–3 MD | **Depends on:** Phase 1 | **Milestone:** CRUD works, round-robin generates matches
>
> Parent: [Tournaments_Analysis_Report.md](Tournaments_Analysis_Report.md)

---

## Checklist

- [x] 2.1 `src/queries/tournaments/` — constants, types, queries, mutations, barrel
- [x] 2.2 `src/queries/tournamentTeams/` — team management queries/mutations
- [x] 2.3 `src/hooks/entities/tournament/` — fetch + CRUD hooks
- [x] 2.4 Round-robin generator utility
- [x] 2.5 Tournament standings calculator
- [x] 2.6 Extend `useMatchMutations` for tournament context
- [x] 2.7 `fetchTournamentBySlug` public query
- [x] 2.8 Register in entity config + API routes
- [x] 2.9 Add query keys
- [x] 2.10 Run `/generate-barrels`
- [x] 2.11 Verify: `npm run tsc && npm run lint`

---

## 2.1 Tournament queries layer (0.5 MD)

### `src/queries/tournaments/constants.ts`

**Reference:** `src/queries/matches/constants.ts`

```typescript
const DB_TABLE = 'tournaments';

const ENTITY = {
  plural: 'Tournaments',
  singular: 'Tournament',
};

export {DB_TABLE, ENTITY};
```

### `src/queries/tournaments/types.ts`

**Reference:** `src/queries/matches/types.ts`

```typescript
export interface TournamentInsertData {
  name: string;
  slug: string;
  description?: string | null;
  category_id: string;
  season_id: string;
  start_date: string;
  end_date?: string | null;
  venue?: string | null;
  status?: string;
  post_id?: string | null;
  image_url?: string | null;
}

export interface TournamentUpdateData {
  name?: string;
  slug?: string;
  description?: string | null;
  category_id?: string;
  season_id?: string;
  start_date?: string;
  end_date?: string | null;
  venue?: string | null;
  status?: string;
  post_id?: string | null;
  image_url?: string | null;
}
```

### `src/queries/tournaments/queries.ts`

**Reference:** `src/queries/blogPosts/queries.ts` (for `fetchBySlug` pattern)

Two query styles needed:
1. **Server-side** (QueryContext pattern) — `getAllTournaments`, `getTournamentById`
2. **Client-side** — `fetchTournaments`, `fetchTournamentBySlug`

```typescript
import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {Tournament} from '@/types';
import {supabaseBrowserClient} from '@/utils/supabase/client';

import {DB_TABLE, ENTITY} from './constants';

// --- Server-side queries (QueryContext) ---

export async function getAllTournaments(
  ctx: QueryContext,
  options?: GetEntitiesOptions
): Promise<QueryResult<Tournament[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
      sorting: options?.sorting,
      pagination: options?.pagination,
      filters: options?.filters,
    });

    const {data, error, count} = await query;
    const paginationBugResult = handleSupabasePaginationBug<Tournament>(error, count);
    if (paginationBugResult) return paginationBugResult;

    return {data: data as unknown as Tournament[], error: null, count: count ?? 0};
  } catch (err: any) {
    console.error(`Exception in getAll${ENTITY.plural}:`, err);
    return {data: null, error: err.message || 'Unknown error', count: 0};
  }
}

export async function getTournamentById(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<Tournament>> {
  try {
    const query = buildSelectOneQuery(ctx.supabase, DB_TABLE, id);
    const {data, error} = await query;
    if (error) return {data: null, error: error.message};
    return {data: data as unknown as Tournament, error: null};
  } catch (err: any) {
    return {data: null, error: err.message || 'Unknown error'};
  }
}

// --- Client-side queries ---

export async function fetchTournamentBySlug(slug: string) {
  const supabase = supabaseBrowserClient();

  const {data, error} = await supabase
    .from(DB_TABLE)
    .select(`
      *,
      category:categories(id, name, slug),
      season:seasons(id, name)
    `)
    .eq('slug', slug)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Tournament not found');

  return data as Tournament;
}
```

### `src/queries/tournaments/mutations.ts`

**Reference:** `src/queries/matches/mutations.ts`

```typescript
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {Tournament} from '@/types';

import {DB_TABLE, ENTITY} from './constants';
import {TournamentInsertData, TournamentUpdateData} from './types';

let helpers: ReturnType<typeof createMutationHelpers<Tournament, TournamentInsertData>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<Tournament, TournamentInsertData>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

export const createTournament = (ctx: QueryContext, data: TournamentInsertData) =>
  getHelpers().create(ctx, data);

export const updateTournament = (ctx: QueryContext, id: string, data: Partial<TournamentUpdateData>) =>
  getHelpers().update(ctx, id, data);

export const deleteTournament = (ctx: QueryContext, id: string) =>
  getHelpers().delete(ctx, id);
```

### `src/queries/tournaments/index.ts`

```typescript
export * from './constants';
export * from './queries';
export * from './mutations';
export type * from './types';
```

---

## 2.2 Tournament teams queries (0.3 MD)

### `src/queries/tournamentTeams/constants.ts`

```typescript
const DB_TABLE = 'tournament_teams';
const ENTITY = {plural: 'TournamentTeams', singular: 'TournamentTeam'};
export {DB_TABLE, ENTITY};
```

### `src/queries/tournamentTeams/mutations.ts`

Custom mutations (not using `createMutationHelpers` — needs specialized operations):

```typescript
import {QueryContext} from '@/queries/shared/types';

import {DB_TABLE} from './constants';

export async function addTeamToTournament(
  ctx: QueryContext,
  tournamentId: string,
  teamId: string,
  seedOrder: number
) {
  try {
    const {data, error} = await ctx.supabase
      .from(DB_TABLE)
      .insert({tournament_id: tournamentId, team_id: teamId, seed_order: seedOrder})
      .select()
      .single();

    if (error) return {data: null, error: error.message};
    return {data, error: null};
  } catch (err: any) {
    return {data: null, error: err.message || 'Unknown error'};
  }
}

export async function removeTeamFromTournament(
  ctx: QueryContext,
  tournamentId: string,
  teamId: string
) {
  try {
    const {error} = await ctx.supabase
      .from(DB_TABLE)
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('team_id', teamId);

    if (error) return {data: null, error: error.message};
    return {data: {success: true}, error: null};
  } catch (err: any) {
    return {data: null, error: err.message || 'Unknown error'};
  }
}

export async function updateSeedOrders(
  ctx: QueryContext,
  tournamentId: string,
  teams: Array<{teamId: string; seedOrder: number}>
) {
  try {
    // Bulk update seed orders
    for (const {teamId, seedOrder} of teams) {
      const {error} = await ctx.supabase
        .from(DB_TABLE)
        .update({seed_order: seedOrder})
        .eq('tournament_id', tournamentId)
        .eq('team_id', teamId);

      if (error) return {data: null, error: error.message};
    }
    return {data: {success: true}, error: null};
  } catch (err: any) {
    return {data: null, error: err.message || 'Unknown error'};
  }
}
```

### `src/queries/tournamentTeams/queries.ts`

```typescript
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {supabaseBrowserClient} from '@/utils/supabase/client';

import {DB_TABLE} from './constants';

export async function fetchTournamentTeams(tournamentId: string) {
  const supabase = supabaseBrowserClient();

  const {data, error} = await supabase
    .from(DB_TABLE)
    .select(`
      id,
      tournament_id,
      team_id,
      seed_order,
      team:club_category_teams(
        id,
        team_suffix,
        club_category:club_categories(
          club:clubs(id, name, short_name, logo_url)
        )
      )
    `)
    .eq('tournament_id', tournamentId)
    .order('seed_order', {ascending: true});

  if (error) throw error;
  return data;
}
```

---

## 2.3 Hooks (0.5 MD)

### `src/hooks/entities/tournament/data/useFetchTournaments.ts`

**Reference:** `src/hooks/entities/grant/data/useFetchGrants.ts`

```typescript
import {createDataFetchHook} from '@/hooks/factories';
import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';
import {DB_TABLE, ENTITY} from '@/queries/tournaments';
import {Tournament} from '@/types';

const t = translations.tournaments.responseMessages;

export function useFetchTournaments() {
  return createDataFetchHook<Tournament>({
    endpoint: API_ROUTES.entities.root(DB_TABLE),
    entityName: ENTITY.plural,
    errorMessage: t.fetchFailed,
  })();
}
```

### `src/hooks/entities/tournament/state/useTournaments.ts`

**Reference:** `src/hooks/entities/grant/state/useGrants.ts`

```typescript
'use client';

import {createCRUDHook} from '@/hooks/factories';
import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';
import {DB_TABLE, ENTITY} from '@/queries/tournaments';
import {CreateTournament, Tournament} from '@/types';

const t = translations.tournaments.responseMessages;

export function useTournaments() {
  const {loading, error, create, update, deleteItem, setLoading} = createCRUDHook<
    Tournament,
    CreateTournament
  >({
    baseEndpoint: API_ROUTES.entities.root(DB_TABLE),
    byIdEndpoint: (id) => API_ROUTES.entities.byId(DB_TABLE, id),
    entityName: ENTITY.singular,
    messages: {
      createSuccess: t.createSuccess,
      updateSuccess: t.updateSuccess,
      deleteSuccess: t.deleteSuccess,
      createError: t.createError,
      updateError: t.updateError,
      deleteError: t.deleteError,
    },
  })();

  return {
    loading,
    error,
    createTournament: create,
    updateTournament: update,
    deleteTournament: deleteItem,
    setLoading,
  };
}
```

---

## 2.4 Round-robin generator (0.5 MD)

**File:** `src/utils/roundRobinGenerator.ts`

### Algorithm: Circle method

For N teams:
- If N is odd, add a "BYE" placeholder → N becomes even.
- Fix team at index 0, rotate teams 1..N-1.
- N-1 rounds, N/2 matches per round.
- Total matches: N*(N-1)/2.

### Interface

```typescript
interface RoundRobinMatch {
  home_team_id: string;
  away_team_id: string;
  round: number;
}

interface GenerateRoundRobinOptions {
  teams: Array<{team_id: string; seed_order: number}>;
}

interface GenerateRoundRobinResult {
  matches: RoundRobinMatch[];
  rounds: number;
  hasByes: boolean;
}

export function generateRoundRobin(options: GenerateRoundRobinOptions): GenerateRoundRobinResult;
```

### Key behaviors

| Input | Result |
|---|---|
| 3 teams | 3 rounds, 3 matches (1 bye per round) |
| 4 teams | 3 rounds, 6 matches |
| 5 teams | 5 rounds, 10 matches (1 bye per round) |
| 6 teams | 5 rounds, 15 matches |
| 8 teams | 7 rounds, 28 matches |

### Schedule generation flow (called from admin UI)

```typescript
export async function generateTournamentSchedule(
  tournamentId: string,
  options: {wipeExisting: boolean}
): Promise<{success: boolean; error?: string; matchCount?: number}>;
```

Steps:
1. Fetch tournament metadata (category_id, season_id, start_date, venue).
2. Fetch `tournament_teams` ordered by `seed_order`.
3. Validate: minimum 3 teams.
4. If matches exist and `wipeExisting === false` → return error.
5. If `wipeExisting === true` → delete existing matches with `tournament_id`.
6. Call `generateRoundRobin()` to get pairings.
7. Filter out bye matches.
8. Insert matches into `matches` table with:
   - `tournament_id`, `round`, `competition = 'tournament'`
   - `category_id`, `season_id` from tournament
   - `date` = tournament `start_date`, `venue` from tournament
   - `status = 'upcoming'`
9. Return `{success: true, matchCount}`.

### Unit tests required

**File:** `src/utils/__tests__/roundRobinGenerator.test.ts`

| Test case | Assertion |
|---|---|
| 4 teams | 6 matches, 3 rounds, each pair once |
| 5 teams (odd) | 10 matches, 5 rounds, `hasByes: true` |
| 6 teams | 15 matches, 5 rounds |
| 3 teams (minimum) | 3 matches, 3 rounds |
| 2 teams → error | Minimum 3 teams |
| Each pair plays exactly once | No duplicate pairings |
| No self-matches | `home_team_id !== away_team_id` in every match |
| Seed order respected | Higher seed is home in first meeting |

---

## 2.5 Tournament standings calculator (0.3 MD)

**File:** `src/utils/tournamentStandingsCalculator.ts`

**Reference:** `src/utils/standingsCalculator.ts` — adapt for tournament context.

### Key differences from league standings

| Aspect | League (`standingsCalculator`) | Tournament |
|---|---|---|
| Scope | `category_id + season_id` | `tournament_id` |
| Table | `standings` | `tournament_standings` |
| Upsert key | `(category_id, season_id, team_id)` | `(tournament_id, team_id)` |
| Team source | `club_categories` query | `tournament_teams` query |
| Points | 2/1/0 | 2/1/0 (same) |

### Interface

```typescript
export async function calculateTournamentStandings(
  tournamentId: string
): Promise<{success: boolean; error?: string}>;

export async function generateInitialTournamentStandings(
  tournamentId: string
): Promise<{success: boolean; error?: string; standings?: any[]}>;
```

### Logic

1. Fetch `tournament_teams` for the tournament.
2. Fetch completed matches: `matches WHERE tournament_id = X AND status = 'completed'`.
3. Initialize standings map (all teams, zero stats).
4. Process each match (same W/D/L logic as `standingsCalculator`).
5. Sort: points DESC → goal diff DESC → goals scored DESC.
6. Assign positions.
7. Upsert into `tournament_standings` on `(tournament_id, team_id)`.

---

## 2.6 Extend `useMatchMutations` for tournament context (0.2 MD)

**File:** `src/hooks/entities/match/state/useMatchMutations.ts`

### Changes needed

1. Add optional `tournamentId` to `UseMatchMutationsOptions`:

```typescript
export interface UseMatchMutationsOptions {
  selectedCategory: string;
  selectedSeason: string;
  tournamentId?: string;           // NEW
  onStandingsRefresh?: () => Promise<void>;
}
```

2. In `invalidateMatchQueries`, also invalidate tournament-scoped keys when `tournamentId` is set:

```typescript
const invalidateMatchQueries = useCallback(async () => {
  await queryClient.invalidateQueries({queryKey: ['matches', 'seasonal', selectedCategory, selectedSeason]});
  await queryClient.invalidateQueries({queryKey: ['matches']});
  if (tournamentId) {
    await queryClient.invalidateQueries({queryKey: ['tournament-matches', tournamentId]});
    await queryClient.invalidateQueries({queryKey: ['tournament-standings', tournamentId]});
  }
}, [queryClient, selectedCategory, selectedSeason, tournamentId]);
```

3. In `updateMatch` and `updateMatchResult`, when scores change and `tournamentId` is set, call `calculateTournamentStandings(tournamentId)` instead of `autoRecalculateStandings(matchId)`.

---

## 2.7 `fetchTournamentBySlug` public query (0.2 MD)

Already covered in 2.1 queries. Additionally, create a combined data-fetching function for the public page:

**File:** `src/queries/tournaments/queries.ts` (add to existing)

```typescript
export async function fetchTournamentPageData(slug: string) {
  const supabase = supabaseBrowserClient();

  // Parallel fetches
  const [tournament, matches, standings] = await Promise.all([
    fetchTournamentBySlug(slug),
    fetchTournamentMatches(slug),
    fetchTournamentStandings(slug),
  ]);

  return {tournament, matches, standings};
}

async function fetchTournamentMatches(slug: string) {
  const supabase = supabaseBrowserClient();
  const {data, error} = await supabase
    .from('matches')
    .select(`
      *,
      home_team:club_category_teams!home_team_id(id, team_suffix, club_category:club_categories(club:clubs(id, name, short_name, logo_url))),
      away_team:club_category_teams!away_team_id(id, team_suffix, club_category:club_categories(club:clubs(id, name, short_name, logo_url)))
    `)
    .eq('tournament_id', (await supabase.from('tournaments').select('id').eq('slug', slug).single()).data?.id)
    .order('round', {ascending: true})
    .order('date', {ascending: true});

  if (error) throw error;
  return data;
}

async function fetchTournamentStandings(slug: string) {
  const supabase = supabaseBrowserClient();
  const {data: tournament} = await supabase
    .from('tournaments')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!tournament) return [];

  const {data, error} = await supabase
    .from('tournament_standings')
    .select(`
      *,
      team:club_category_teams(
        id, team_suffix,
        club_category:club_categories(club:clubs(id, name, short_name, logo_url))
      )
    `)
    .eq('tournament_id', tournament.id)
    .order('position', {ascending: true});

  if (error) throw error;
  return data;
}
```

---

## 2.8 Register in entity config (0.1 MD)

**File:** `src/app/api/entities/config.ts`

Add tournament entity config:

```typescript
tournaments: {
  tableName: 'tournaments',
  sortBy: [{column: 'start_date', ascending: false}],
  requiresAdmin: false,
  isPublic: true,
  queryLayer: {
    getAll: tournamentsQueries.getAllTournaments,
    getById: tournamentsQueries.getTournamentById,
    create: tournamentsQueries.createTournament,
    update: tournamentsQueries.updateTournament,
    delete: tournamentsQueries.deleteTournament,
  },
  pagination: {defaultLimit: 25, maxLimit: 100},
},
```

---

## 2.9 Add query keys (0.05 MD)

**File:** `src/lib/queryKeys.ts`

```typescript
tournaments: {
  all: ['tournaments'] as const,
  lists: () => [...queryKeys.tournaments.all, 'list'] as const,
  detail: (id: string) => [...queryKeys.tournaments.all, 'detail', id] as const,
  bySlug: (slug: string) => [...queryKeys.tournaments.all, 'slug', slug] as const,
  teams: (tournamentId: string) => [...queryKeys.tournaments.all, 'teams', tournamentId] as const,
  matches: (tournamentId: string) => [...queryKeys.tournaments.all, 'matches', tournamentId] as const,
  standings: (tournamentId: string) => [...queryKeys.tournaments.all, 'standings', tournamentId] as const,
},
```

---

## 2.10 Barrel exports

Run `/generate-barrels` to regenerate:
- `src/hooks/index.ts`
- `src/types/index.ts`

Manually update:
- `src/lib/api-routes.ts` (or run `npm run generate:api-routes`)

---

## 2.11 Verification

```bash
npm run tsc
npm run lint
npm run test:run   # round-robin generator tests
```

---

## Expected file tree after Phase 2

```
src/queries/tournaments/
  constants.ts
  types.ts
  queries.ts
  mutations.ts
  index.ts

src/queries/tournamentTeams/
  constants.ts
  queries.ts
  mutations.ts
  index.ts

src/hooks/entities/tournament/
  data/useFetchTournaments.ts
  state/useTournaments.ts

src/utils/
  roundRobinGenerator.ts
  tournamentStandingsCalculator.ts
  __tests__/roundRobinGenerator.test.ts

src/lib/queryKeys.ts                    ← updated
src/app/api/entities/config.ts          ← updated
src/hooks/entities/match/state/useMatchMutations.ts  ← extended
```

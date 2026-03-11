import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {DB_TABLE, ENTITY} from '@/queries/tournaments';
import {Tournament} from '@/types';
import {supabaseBrowserClient} from '@/utils';

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
    if (paginationBugResult) {
      return paginationBugResult;
    }
    return {
      data: data as unknown as Tournament[],
      error: null,
      count: count ?? 0,
    };
  } catch (err: any) {
    console.error(`Exception in getAll${ENTITY.plural}: `, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
      count: 0,
    };
  }
}

export async function getTournamentById(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<Tournament>> {
  try {
    const query = buildSelectOneQuery(ctx.supabase, DB_TABLE, id);
    const {data, error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as unknown as Tournament,
      error: null,
    };
  } catch (err: any) {
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

export async function fetchTournamentBySlug(slug: string) {
  const supabase = supabaseBrowserClient();

  const {data, error} = await supabase
    .from(DB_TABLE)
    .select(
      `
      *,
      category:categories(id, name, slug),
      season:seasons(id, name)
    `
    )
    .eq('slug', slug)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Tournament not found');

  return data as Tournament;
}

export async function fetchTournamentPageData(slug: string) {
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
    .select(
      `
      *,
      home_team:club_category_teams!home_team_id(id, team_suffix, club_category:club_categories(club:clubs(id, name, short_name, logo_url))),
      away_team:club_category_teams!away_team_id(id, team_suffix, club_category:club_categories(club:clubs(id, name, short_name, logo_url)))
    `
    )
    .eq(
      'tournament_id',
      (await supabase.from('tournaments').select('id').eq('slug', slug).single()).data?.id
    )
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
    .select(
      `
      *,
      team:club_category_teams(
        id, team_suffix,
        club_category:club_categories(club:clubs(id, name, short_name, logo_url))
      )
    `
    )
    .eq('tournament_id', tournament.id)
    .order('position', {ascending: true});

  if (error) throw error;
  return data;
}

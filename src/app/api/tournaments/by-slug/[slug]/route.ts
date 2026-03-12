import {NextRequest} from 'next/server';

import {SupabaseClient} from '@supabase/supabase-js';

import {errorResponse, successResponse, withPublicAccess} from '@/utils/supabase/apiHelpers';

export async function GET(request: NextRequest, {params}: {params: Promise<{slug: string}>}) {
  return withPublicAccess(async (supabase: SupabaseClient) => {
    const {slug} = await params;

    const {data: tournament, error} = await supabase
      .from('tournaments')
      .select(
        `
        *,
        category:categories(id, name, slug),
        season:seasons(id, name)
      `
      )
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
        .select(
          `
          *,
          home_team:club_category_teams!home_team_id(
            id, team_suffix,
            club_category:club_categories(club:clubs(id, name, short_name, logo_url))
          ),
          away_team:club_category_teams!away_team_id(
            id, team_suffix,
            club_category:club_categories(club:clubs(id, name, short_name, logo_url))
          )
        `
        )
        .eq('tournament_id', tournament.id)
        .order('round')
        .order('date'),
      supabase
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
        .order('position'),
    ]);

    return successResponse({
      tournament,
      matches: matchesResult.data || [],
      standings: standingsResult.data || [],
    });
  });
}

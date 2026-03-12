import {NextRequest} from 'next/server';

import {SupabaseClient} from '@supabase/supabase-js';

import {errorResponse, successResponse, withPublicAccess} from '@/utils/supabase/apiHelpers';

export async function GET(_request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withPublicAccess(async (supabase: SupabaseClient) => {
    const {id} = await params;

    if (!id) {
      return errorResponse('Tournament ID is required', 400);
    }

    try {
      const {data, error} = await supabase
        .from('matches')
        .select(
          `
					*,
					home_team:club_category_teams!home_team_id(id, team_suffix, club_category:club_categories(club:clubs(id, name, short_name, logo_url))),
					away_team:club_category_teams!away_team_id(id, team_suffix, club_category:club_categories(club:clubs(id, name, short_name, logo_url)))
				`
        )
        .eq('tournament_id', id)
        .order('round', {ascending: true})
        .order('match_number', {ascending: true});

      if (error) throw error;

      return successResponse(data);
    } catch (err: any) {
      return errorResponse(err.message);
    }
  });
}

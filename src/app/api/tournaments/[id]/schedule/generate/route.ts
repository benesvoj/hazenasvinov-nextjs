import {NextRequest} from 'next/server';

import {generateRoundRobin} from '@/utils/roundRobinGenerator';
import {errorResponse, successResponse, withAdminAuth} from '@/utils/supabase/apiHelpers';

export async function POST(_request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAdminAuth(async (_user, _supabase, admin) => {
    const {id} = await params;

    if (!id) {
      return errorResponse('Tournament ID is required', 400);
    }

    try {
      // 1. Fetch tournament
      const {data: tournament, error: tournamentError} = await admin
        .from('tournaments')
        .select('id, category_id, season_id, venue, name, start_date')
        .eq('id', id)
        .single();

      if (tournamentError || !tournament) {
        return errorResponse('Turnaj nebyl nalezen', 404);
      }

      // 2. Fetch tournament teams with seed_order
      const {data: teams, error: teamsError} = await admin
        .from('tournament_teams')
        .select('team_id, seed_order')
        .eq('tournament_id', id)
        .order('seed_order', {ascending: true});

      if (teamsError) throw teamsError;

      // 3. Validate >= 3 teams
      if (!teams || teams.length < 3) {
        return errorResponse('Turnaj vyžaduje alespoň 3 týmy', 400);
      }

      // 4. Generate round-robin schedule
      const schedule = generateRoundRobin({teams});

      // 5. Delete existing matches
      const {error: deleteError} = await admin.from('matches').delete().eq('tournament_id', id);

      if (deleteError) throw deleteError;

      // 6. Bulk insert new matches
      let matchNumber = 0;
      const matchInserts = schedule.matches.map((match) => {
        matchNumber++;
        return {
          tournament_id: id,
          round: match.round,
          home_team_id: match.home_team_id,
          away_team_id: match.away_team_id,
          category_id: tournament.category_id,
          season_id: tournament.season_id,
          date: tournament.start_date,
          time: '00:00',
          venue: tournament.venue || '',
          competition: tournament.name,
          is_home: false,
          status: 'upcoming',
          matchweek: null,
          match_number: matchNumber,
        };
      });

      const {error: insertError} = await admin.from('matches').insert(matchInserts);

      if (insertError) throw insertError;

      return successResponse({
        matchesCreated: matchInserts.length,
        rounds: schedule.rounds,
        hasByes: schedule.hasByes,
      });
    } catch (err: any) {
      return errorResponse(err.message);
    }
  });
}

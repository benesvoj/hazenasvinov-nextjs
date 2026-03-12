import {supabaseBrowserClient} from '@/utils/supabase/client';

import {TournamentStanding} from '@/types';

/**
 * Match data needed for standings calculation.
 * Only completed matches with scores should be passed in.
 */
export interface TournamentMatchForStandings {
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
}

/**
 * Computed standing for a single team (pure data, no DB fields).
 */
export interface ComputedStanding {
  team_id: string;
  position: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
}

/**
 * Pure function — computes tournament standings from matches and team IDs.
 * Points: win = 2, draw = 1, loss = 0.
 * Sort: points DESC → goal diff DESC → goals scored DESC.
 *
 * Teams without any matches get zero stats but are still included.
 */
export function computeTournamentStandings(
  teamIds: string[],
  completedMatches: TournamentMatchForStandings[]
): ComputedStanding[] {
  if (teamIds.length === 0) {
    return [];
  }

  // Initialize standings map
  const standingsMap = new Map<string, ComputedStanding>();
  teamIds.forEach((teamId) => {
    standingsMap.set(teamId, {
      team_id: teamId,
      position: 0,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      points: 0,
    });
  });

  // Process matches
  completedMatches.forEach((match) => {
    const home = standingsMap.get(match.home_team_id);
    const away = standingsMap.get(match.away_team_id);

    if (!home || !away) return; // skip matches with unknown teams

    home.matches++;
    away.matches++;

    home.goals_for += match.home_score;
    home.goals_against += match.away_score;
    away.goals_for += match.away_score;
    away.goals_against += match.home_score;

    if (match.home_score > match.away_score) {
      // Home wins
      home.wins++;
      home.points += 2;
      away.losses++;
    } else if (match.home_score < match.away_score) {
      // Away wins
      away.wins++;
      away.points += 2;
      home.losses++;
    } else {
      // Draw
      home.draws++;
      home.points += 1;
      away.draws++;
      away.points += 1;
    }
  });

  // Sort: points DESC → goal diff DESC → goals scored DESC
  const sorted = Array.from(standingsMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aGD = a.goals_for - a.goals_against;
    const bGD = b.goals_for - b.goals_against;
    if (bGD !== aGD) return bGD - aGD;
    return b.goals_for - a.goals_for;
  });

  // Assign positions
  sorted.forEach((standing, index) => {
    standing.position = index + 1;
  });

  return sorted;
}

export async function calculateTournamentStandings(
  tournamentId: string
): Promise<{success: boolean; error?: string}> {
  const supabase = supabaseBrowserClient();

  const {data: teams} = await supabase
    .from('tournament_teams')
    .select('team_id')
    .eq('tournament_id', tournamentId);

  const {data: matches} = await supabase
    .from('matches')
    .select('home_team_id, away_team_id, home_score, away_score')
    .eq('tournament_id', tournamentId)
    .eq('status', 'completed');

  const standings = computeTournamentStandings(
    teams.map((t: {team_id: string}) => t.team_id),
    matches
  );

  const rows = standings.map((s) => ({
    tournament_id: tournamentId,
    ...s,
  }));

  await supabase.from('tournament_standings').upsert(rows, {onConflict: 'tournament_id, team_id'});

  return {
    success: true,
  };
}

export async function generateInitialTournamentStandings(
  tournamentId: string
): Promise<{success: boolean; error?: string; standings?: TournamentStanding[]}> {
  const supabase = supabaseBrowserClient();

  try {
    const {data: teams, error: teamsError} = await supabase
      .from('tournament_teams')
      .select('team_id')
      .eq('tournament_id', tournamentId);

    if (teamsError) throw teamsError;
    if (!teams || teams.length === 0) {
      return {success: false, error: 'Turnaj nemá žádné týmy'};
    }

    const rows = teams.map((t: {team_id: string}, index: number) => ({
      tournament_id: tournamentId,
      team_id: t.team_id,
      position: index + 1,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      points: 0,
    }));

    const {error: upsertError} = await supabase
      .from('tournament_standings')
      .upsert(rows, {onConflict: 'tournament_id, team_id'});

    if (upsertError) throw upsertError;

    return {success: true};
  } catch (error: any) {
    console.error(`Error generating initial standings for tournament ${tournamentId}:`, error);
    return {success: false, error: error.message || 'Unknown error'};
  }
}

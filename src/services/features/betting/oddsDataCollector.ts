import {createClient} from '@/utils/supabase/client';

import {Match, TeamStats} from '@/types';

/**
 * Odds Data Collector Service
 * Collects and aggregates team statistics from historical match data
 */

/**
 * Get team statistics for odds calculation
 * @param teamId Team ID
 * @param matchLimit Number of recent matches to consider (default: 15)
 * @returns Team statistics or null
 */
export async function getTeamStats(
  teamId: string,
  matchLimit: number = 15
): Promise<TeamStats | null> {
  const supabase = createClient();

  try {
    // Fetch completed matches for this team (home and away)
    const {data: matches, error} = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, home_score, away_score, date')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .eq('status', 'completed')
      .not('home_score', 'is', null)
      .not('away_score', 'is', null)
      .order('date', {ascending: false})
      .limit(matchLimit);

    if (error || !matches || matches.length === 0) {
      console.error('Error fetching team stats:', error);
      return null;
    }

    // Initialize stats
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsScored = 0;
    let goalsConceded = 0;

    let homeWins = 0;
    let homeDraws = 0;
    let homeLosses = 0;
    let homeGoalsScored = 0;
    let homeGoalsConceded = 0;
    let homeMatches = 0;

    let awayWins = 0;
    let awayDraws = 0;
    let awayLosses = 0;
    let awayGoalsScored = 0;
    let awayGoalsConceded = 0;
    let awayMatches = 0;

    const formArray: string[] = [];

    // Process each match
    matches.forEach((match: Match) => {
      const isHome = match.home_team_id === teamId;
      const homeScore = match.home_score ?? 0;
      const awayScore = match.away_score ?? 0;

      const teamScore = isHome ? homeScore : awayScore;
      const opponentScore = isHome ? awayScore : homeScore;

      // Overall stats
      goalsScored += teamScore;
      goalsConceded += opponentScore;

      if (teamScore > opponentScore) {
        wins++;
        formArray.push('W');
        if (isHome) {
          homeWins++;
        } else {
          awayWins++;
        }
      } else if (teamScore === opponentScore) {
        draws++;
        formArray.push('D');
        if (isHome) {
          homeDraws++;
        } else {
          awayDraws++;
        }
      } else {
        losses++;
        formArray.push('L');
        if (isHome) {
          homeLosses++;
        } else {
          awayLosses++;
        }
      }

      // Home/Away specific stats
      if (isHome) {
        homeMatches++;
        homeGoalsScored += teamScore;
        homeGoalsConceded += opponentScore;
      } else {
        awayMatches++;
        awayGoalsScored += teamScore;
        awayGoalsConceded += opponentScore;
      }
    });

    const matchesPlayed = matches.length;
    const winRate = matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0;
    const drawRate = matchesPlayed > 0 ? (draws / matchesPlayed) * 100 : 0;
    const lossRate = matchesPlayed > 0 ? (losses / matchesPlayed) * 100 : 0;
    const avgGoalsScored = matchesPlayed > 0 ? goalsScored / matchesPlayed : 0;
    const avgGoalsConceded = matchesPlayed > 0 ? goalsConceded / matchesPlayed : 0;

    // Get form of last 5 matches
    const form = formArray.slice(0, 5).join('');

    return {
      team_id: teamId,
      matches_played: matchesPlayed,
      wins,
      draws,
      losses,
      goals_scored: goalsScored,
      goals_conceded: goalsConceded,
      home_record: {
        matches: homeMatches,
        wins: homeWins,
        draws: homeDraws,
        losses: homeLosses,
        goals_scored: homeGoalsScored,
        goals_conceded: homeGoalsConceded,
      },
      away_record: {
        matches: awayMatches,
        wins: awayWins,
        draws: awayDraws,
        losses: awayLosses,
        goals_scored: awayGoalsScored,
        goals_conceded: awayGoalsConceded,
      },
      win_rate: Number(winRate.toFixed(2)),
      draw_rate: Number(drawRate.toFixed(2)),
      loss_rate: Number(lossRate.toFixed(2)),
      avg_goals_scored: Number(avgGoalsScored.toFixed(2)),
      avg_goals_conceded: Number(avgGoalsConceded.toFixed(2)),
      form,
    };
  } catch (error) {
    console.error('Error in getTeamStats:', error);
    return null;
  }
}

/**
 * Get expected goals for a team based on their stats
 * @param stats Team statistics
 * @param isHome Whether the team is playing at home
 * @returns Expected goals
 */
export function getExpectedGoals(stats: TeamStats, isHome: boolean): number {
  if (!stats) return 1.3; // Default for amateur/youth leagues

  const record = isHome ? stats.home_record : stats.away_record;

  // Calculate expected goals based on historical average
  if (record.matches > 0) {
    const avgGoals = record.goals_scored / record.matches;
    // Ensure reasonable bounds: 0.8 to 4.0 goals per team
    // This prevents extreme probabilities in Poisson calculations
    return Number(Math.max(0.8, Math.min(4.0, avgGoals)).toFixed(2));
  }

  // Fallback to overall average (with safety bounds)
  const overallAvg = stats.avg_goals_scored;
  return Number(Math.max(0.8, Math.min(4.0, overallAvg > 0 ? overallAvg : 1.3)).toFixed(2));
}

/**
 * Calculate team strength rating (simple implementation)
 * @param stats Team statistics
 * @returns Strength rating (0-100)
 */
export function calculateTeamStrength(stats: TeamStats): number {
  if (!stats || stats.matches_played === 0) return 50; // Neutral

  // Weighted combination of factors
  const winFactor = stats.win_rate * 0.4;
  const goalDiffFactor = ((stats.goals_scored - stats.goals_conceded) / stats.matches_played) * 10;
  const formFactor = calculateFormScore(stats.form) * 0.3;

  let strength = 50 + winFactor * 0.5 + goalDiffFactor + formFactor;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Number(strength.toFixed(2))));
}

/**
 * Calculate form score from recent results
 * @param form Form string (e.g., "WWDLW")
 * @returns Form score (-5 to 5)
 */
function calculateFormScore(form: string): number {
  if (!form) return 0;

  let score = 0;
  const formArray = form.split('');

  formArray.forEach((result, index) => {
    // More recent results have higher weight
    const weight = formArray.length - index;

    switch (result) {
      case 'W':
        score += 1 * weight;
        break;
      case 'D':
        score += 0.3 * weight;
        break;
      case 'L':
        score -= 0.5 * weight;
        break;
    }
  });

  return score;
}

/**
 * Calculate head-to-head statistics between two teams
 * @param team1Id First team ID
 * @param team2Id Second team ID
 * @param matchLimit Number of recent H2H matches to consider
 * @returns Head-to-head stats
 */
export async function getHeadToHeadStats(
  team1Id: string,
  team2Id: string,
  matchLimit: number = 5
): Promise<{
  team1_wins: number;
  team2_wins: number;
  draws: number;
  avg_goals: number;
} | null> {
  const supabase = createClient();

  try {
    const {data: matches, error} = await supabase
      .from('matches')
      .select('home_team_id, away_team_id, home_score, away_score')
      .or(
        `and(home_team_id.eq.${team1Id},away_team_id.eq.${team2Id}),and(home_team_id.eq.${team2Id},away_team_id.eq.${team1Id})`
      )
      .eq('status', 'completed')
      .not('home_score', 'is', null)
      .not('away_score', 'is', null)
      .order('date', {ascending: false})
      .limit(matchLimit);

    if (error || !matches || matches.length === 0) {
      return null;
    }

    let team1Wins = 0;
    let team2Wins = 0;
    let draws = 0;
    let totalGoals = 0;

    matches.forEach((match: Match) => {
      const team1IsHome = match.home_team_id === team1Id;
      const homeScore = match.home_score ?? 0;
      const awayScore = match.away_score ?? 0;

      const team1Score = team1IsHome ? homeScore : awayScore;
      const team2Score = team1IsHome ? awayScore : homeScore;

      totalGoals += homeScore + awayScore;

      if (team1Score > team2Score) {
        team1Wins++;
      } else if (team2Score > team1Score) {
        team2Wins++;
      } else {
        draws++;
      }
    });

    return {
      team1_wins: team1Wins,
      team2_wins: team2Wins,
      draws,
      avg_goals: Number((totalGoals / matches.length).toFixed(2)),
    };
  } catch (error) {
    console.error('Error in getHeadToHeadStats:', error);
    return null;
  }
}

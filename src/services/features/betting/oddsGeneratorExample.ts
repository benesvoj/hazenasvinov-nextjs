/**
 * Example usage of the odds generator
 * This file demonstrates how to use the odds generation system
 */

import {OddsGenerationInput} from '@/types/features/betting/odds';

import {generateMatchOdds} from './oddsGeneratorService';

/**
 * Example: Generate odds for a specific match
 */
export async function generateOddsExample() {
  const input: OddsGenerationInput = {
    match_id: 'your-match-id-here',
    home_team_id: 'home-team-id',
    away_team_id: 'away-team-id',
    bookmaker_margin: 0.05, // 5% margin
    use_form: true,
    form_weight: 0.3,
  };

  const result = await generateMatchOdds(input);

  if (!result) {
    console.error('Failed to generate odds');
    return null;
  }

  console.log('Generated Odds:', {
    '1X2': result.odds['1X2'],
    BTTS: result.odds.BOTH_TEAMS_SCORE,
    'O/U 2.5': result.odds.OVER_UNDER,
  });

  console.log('Probabilities:', {
    home_win: `${(result.probabilities.home_win * 100).toFixed(1)}%`,
    draw: `${(result.probabilities.draw * 100).toFixed(1)}%`,
    away_win: `${(result.probabilities.away_win * 100).toFixed(1)}%`,
  });

  console.log('Expected Goals:', {
    home: result.probabilities.home_expected_goals,
    away: result.probabilities.away_expected_goals,
  });

  console.log('Team Stats:', {
    home_team: {
      form: result.stats.home_team.form,
      win_rate: `${result.stats.home_team.win_rate}%`,
      avg_goals: result.stats.home_team.avg_goals_scored,
    },
    away_team: {
      form: result.stats.away_team.form,
      win_rate: `${result.stats.away_team.win_rate}%`,
      avg_goals: result.stats.away_team.avg_goals_scored,
    },
  });

  return result;
}

/**
 * Example: Generate odds for multiple matches in bulk
 */
export async function generateBulkOdds(
  matches: Array<{id: string; home_team_id: string; away_team_id: string}>
) {
  const results = [];

  for (const match of matches) {
    const input: OddsGenerationInput = {
      match_id: match.id,
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      bookmaker_margin: 0.05,
    };

    const result = await generateMatchOdds(input);
    if (result) {
      results.push(result);
    }
  }

  console.log(`Generated odds for ${results.length} out of ${matches.length} matches`);
  return results;
}

/**
 * Example: Save generated odds to database
 */
export async function generateAndSaveOdds(matchId: string, homeTeamId: string, awayTeamId: string) {
  const input: OddsGenerationInput = {
    match_id: matchId,
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    bookmaker_margin: 0.05,
  };

  const result = await generateMatchOdds(input);

  if (!result) {
    return false;
  }

  // TODO: Save to betting_odds table
  // This would be implemented in a separate oddsService.ts file
  console.log('Odds ready to save:', result.odds);

  return true;
}

import {formatOddsValue} from '@/components/features/betting/helpers/formatOddsValue';

import {calculateTeamStrength, getExpectedGoals, getTeamStats} from '@/services';
import {
  calculateMargin,
  hasArbitrageOpportunity,
  MatchOdds,
  MatchProbabilities,
  OddsGenerationInput,
  OddsGenerationResult,
  OddsValidationResult,
  TeamStats,
} from '@/types';

/**
 * Odds Generator Service
 * Generates betting odds using statistical models and Poisson distribution
 */

// Configuration to add on different place in app
const DEFAULT_MARGIN = 0.05; // 5% bookmaker margin
const MIN_ODDS = 1.01;
const MAX_ODDS = 100.0;
const DEFAULT_DRAW_PROBABILITY = 0.27; // 27% draw rate in football
const DEFENSE_FACTOR_WEIGHT = 0.15; // Weight for defensive strength in draw probability
const HISTORICAL_DRAW_RATE_WEIGHT = 0.25; // Weight for historical draw rate in draw probability
const STRENGTH_DIFF_WEIGHT = 0.6; // Weight for strength difference in draw probability
const STRENGTH_DIFF_RANGES_WEIGHT = 0.7; // Strength diff: ranges from 0.7 to 1.3 of base
const DEFENSIVE_FACTOR_MIN = 0.9;
const DEFENSIVE_FACTOR_MAX = 1.1;
const DEFENSIVE_FACTOR_BASE = 1.5; // Average goals conceded per match
const DEFENSIVE_FACTOR_SCALE = 10; // Scale to adjust sensitivity

/**
 * Generate complete odds for a match
 * @param input Odds generation input
 * @returns Complete odds generation result
 */
export async function generateMatchOdds(
  input: OddsGenerationInput
): Promise<OddsGenerationResult | null> {
  try {
    const margin = input.bookmaker_margin || DEFAULT_MARGIN;

    // Step 1: Get team statistics
    const homeTeamStats = await getTeamStats(input.home_team_id);
    const awayTeamStats = await getTeamStats(input.away_team_id);

    if (!homeTeamStats || !awayTeamStats) {
      console.error('Unable to fetch team statistics');
      return null;
    }

    // Step 2: Calculate match probabilities
    const probabilities = calculateMatchProbabilities(homeTeamStats, awayTeamStats, input);

    // Step 3: Generate odds for all markets
    const odds1X2 = generate1X2Odds(probabilities, margin);
    const oddsDoubleChance = generateDoubleChanceOdds(probabilities, margin);
    const oddsBTTS = generateBothTeamsScoreOdds(probabilities, margin);
    const oddsOU = generateOverUnderOdds(probabilities, margin);

    const matchOdds: MatchOdds = {
      match_id: input.match_id,
      '1X2': odds1X2,
      DOUBLE_CHANCE: oddsDoubleChance,
      BOTH_TEAMS_SCORE: oddsBTTS,
      OVER_UNDER: oddsOU,
      last_updated: new Date().toISOString(),
    };

    // Step 4: Validate odds
    const validation = validateOdds(matchOdds);
    if (!validation.isValid) {
      console.error('Generated odds are invalid:', validation.errors);
      return null;
    }

    return {
      match_id: input.match_id,
      odds: matchOdds,
      probabilities,
      stats: {
        home_team: homeTeamStats,
        away_team: awayTeamStats,
      },
      margin,
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in generateMatchOdds:', error);
    return null;
  }
}

/**
 * Calculate dynamic draw probability based on team characteristics
 * @param homeStrength Home team strength (adjusted with home advantage)
 * @param awayStrength Away team strength
 * @param homeTeam Home team statistics
 * @param awayTeam Away team statistics
 * @returns Draw probability
 */
function calculateDynamicDrawProbability(
  homeStrength: number,
  awayStrength: number,
  homeTeam: TeamStats,
  awayTeam: TeamStats
): number {
  // Base draw probability
  const baseDrawProb = DEFAULT_DRAW_PROBABILITY; // 0.27 (27%)

  // Calculate absolute strength difference
  const strengthDiff = Math.abs(homeStrength - awayStrength);

  // Factor 1: Strength difference impact
  // If teams are evenly matched (small diff) -> higher draw probability
  // If there's a clear favorite (large diff) -> lower draw probability
  // Use exponential decay: larger difference = more reduction in draw probability
  const strengthDiffFactor = Math.exp(-strengthDiff / 20); // Decay constant of 20

  // Factor 2: Team draw rates (if available)
  // Teams with higher historical draw rates are more likely to draw
  const homeDrawRate = homeTeam.draws / Math.max(homeTeam.matches_played, 1);
  const awayDrawRate = awayTeam.draws / Math.max(awayTeam.matches_played, 1);
  const avgDrawRate = (homeDrawRate + awayDrawRate) / 2;

  // Factor 3: Defensive strength
  // Teams with strong defenses and similar defensive capabilities tend to draw more
  const homeDefStrength = homeTeam.goals_conceded / Math.max(homeTeam.matches_played, 1);
  const awayDefStrength = awayTeam.goals_conceded / Math.max(awayTeam.matches_played, 1);
  const avgGoalsConceded = (homeDefStrength + awayDefStrength) / 2;

  // Lower goals conceded (stronger defense) = slightly higher draw probability
  // Normalize to a factor between 0.9 and 1.1
  const defensiveFactor = Math.max(
    DEFENSIVE_FACTOR_MIN,
    Math.min(
      DEFENSIVE_FACTOR_MAX,
      1 + (DEFENSIVE_FACTOR_BASE - avgGoalsConceded) / DEFENSIVE_FACTOR_SCALE
    )
  );
  // Combine factors
  // Weight: 60% strength difference, 25% historical draw rate, 15% defensive factor
  const dynamicDrawProb =
    baseDrawProb *
      (STRENGTH_DIFF_WEIGHT *
        (STRENGTH_DIFF_RANGES_WEIGHT + STRENGTH_DIFF_WEIGHT * strengthDiffFactor)) + // Strength diff: ranges from 0.7 to 1.3 of base
    HISTORICAL_DRAW_RATE_WEIGHT * avgDrawRate + // Historical draw rate contribution
    DEFENSE_FACTOR_WEIGHT * baseDrawProb * defensiveFactor; // Defensive factor contribution

  // Ensure draw probability is within reasonable bounds (15% to 40%)
  return Math.max(0.15, Math.min(0.4, dynamicDrawProb));
}

/**
 * Calculate match probabilities using statistical model
 * @param homeTeam Home team statistics
 * @param awayTeam Away team statistics
 * @param input Generation input
 * @returns Match probabilities
 */
export function calculateMatchProbabilities(
  homeTeam: TeamStats,
  awayTeam: TeamStats,
  input?: OddsGenerationInput
): MatchProbabilities {
  // Calculate team strengths
  const homeStrength = calculateTeamStrength(homeTeam);
  const awayStrength = calculateTeamStrength(awayTeam);

  // Add home advantage (typically 3-5 points)
  const homeAdvantage = 4;
  const adjustedHomeStrength = homeStrength + homeAdvantage;

  // Calculate win probabilities
  const strengthDiff = adjustedHomeStrength - awayStrength;

  // Use logistic function to convert strength difference to probability
  // Formula: P(home_win) = 1 / (1 + e^(-k * strengthDiff))
  const k = 0.03; // Sensitivity parameter
  let homeWinProb = 1 / (1 + Math.exp(-k * strengthDiff));

  // Calculate away win probability (mirror of home)
  let awayWinProb = 1 / (1 + Math.exp(k * strengthDiff));

  // Calculate dynamic draw probability based on team strength difference
  // When teams are evenly matched (small strength diff) -> higher draw probability
  // When there's a clear favorite (large strength diff) -> lower draw probability
  const drawProb = calculateDynamicDrawProbability(
    adjustedHomeStrength,
    awayStrength,
    homeTeam,
    awayTeam
  );

  // Normalize probabilities
  const totalProb = homeWinProb + awayWinProb + drawProb;
  homeWinProb = homeWinProb / totalProb;
  awayWinProb = awayWinProb / totalProb;
  const normalizedDrawProb = drawProb / totalProb;

  // Calculate expected goals
  const homeExpectedGoals = getExpectedGoals(homeTeam, true);
  const awayExpectedGoals = getExpectedGoals(awayTeam, false);

  // Calculate over/under probabilities using Poisson
  const totalExpectedGoals = homeExpectedGoals + awayExpectedGoals;
  const over25Prob = calculateOverProbability(homeExpectedGoals, awayExpectedGoals, 2.5);
  const under25Prob = 1 - over25Prob;

  // Calculate both teams to score probability
  const bttsProb = calculateBothTeamsScoreProbability(homeExpectedGoals, awayExpectedGoals);

  return {
    home_win: Number(homeWinProb.toFixed(4)),
    draw: Number(normalizedDrawProb.toFixed(4)),
    away_win: Number(awayWinProb.toFixed(4)),
    over_2_5: Number(over25Prob.toFixed(4)),
    under_2_5: Number(under25Prob.toFixed(4)),
    both_teams_score: Number(bttsProb.toFixed(4)),
    home_expected_goals: homeExpectedGoals,
    away_expected_goals: awayExpectedGoals,
  };
}

/**
 * Generate 1X2 odds from probabilities
 * @param probabilities Match probabilities
 * @param margin Bookmaker margin
 * @returns 1X2 odds
 */
function generate1X2Odds(
  probabilities: MatchProbabilities,
  margin: number
): {
  '1': number;
  X: number;
  '2': number;
} {
  // Normalize probabilities to sum to 1
  const totalProb = probabilities.home_win + probabilities.draw + probabilities.away_win;
  const homeWinNorm = probabilities.home_win / totalProb;
  const drawNorm = probabilities.draw / totalProb;
  const awayWinNorm = probabilities.away_win / totalProb;

  // Convert to fair odds (no margin)
  const fairOdds1 = 1 / homeWinNorm;
  const fairOddsX = 1 / drawNorm;
  const fairOdds2 = 1 / awayWinNorm;

  // Apply margin by reducing odds proportionally
  // This ensures implied probabilities sum to (1 + margin)
  const marginFactor = 1 / (1 + margin);
  const odds1 = fairOdds1 * marginFactor;
  const oddsX = fairOddsX * marginFactor;
  const odds2 = fairOdds2 * marginFactor;

  return {
    '1': formatOddsValue(odds1),
    X: formatOddsValue(oddsX),
    '2': formatOddsValue(odds2),
  };
}

/**
 * Generate Double Chance odds
 * @param probabilities Match probabilities
 * @param margin Bookmaker margin
 * @returns Double Chance odds (1X, X2, 12)
 */
function generateDoubleChanceOdds(
  probabilities: MatchProbabilities,
  margin: number
): {
  '1X': number;
  X2: number;
  '12': number;
} {
  // Normalize probabilities to sum to 1
  const totalProb = probabilities.home_win + probabilities.draw + probabilities.away_win;
  const homeWinNorm = probabilities.home_win / totalProb;
  const drawNorm = probabilities.draw / totalProb;
  const awayWinNorm = probabilities.away_win / totalProb;

  // Calculate combined probabilities for each double chance outcome
  const prob1X = homeWinNorm + drawNorm; // Home or Draw
  const probX2 = drawNorm + awayWinNorm; // Draw or Away
  const prob12 = homeWinNorm + awayWinNorm; // Home or Away (no draw)

  // Convert to fair odds (no margin)
  const fairOdds1X = 1 / prob1X;
  const fairOddsX2 = 1 / probX2;
  const fairOdds12 = 1 / prob12;

  // Apply margin
  const marginFactor = 1 / (1 + margin);
  const odds1X = fairOdds1X * marginFactor;
  const oddsX2 = fairOddsX2 * marginFactor;
  const odds12 = fairOdds12 * marginFactor;

  return {
    '1X': formatOddsValue(odds1X),
    X2: formatOddsValue(oddsX2),
    '12': formatOddsValue(odds12),
  };
}

/**
 * Generate Both Teams to Score odds
 * @param probabilities Match probabilities
 * @param margin Bookmaker margin
 * @returns BTTS odds
 */
function generateBothTeamsScoreOdds(
  probabilities: MatchProbabilities,
  margin: number
): {
  YES: number;
  NO: number;
} {
  const yesProb = probabilities.both_teams_score;
  const noProb = 1 - yesProb;

  // Convert to fair odds
  const fairOddsYes = 1 / yesProb;
  const fairOddsNo = 1 / noProb;

  // Apply margin by reducing odds
  const marginFactor = 1 / (1 + margin);
  const oddsYes = fairOddsYes * marginFactor;
  const oddsNo = fairOddsNo * marginFactor;

  return {
    YES: formatOddsValue(oddsYes),
    NO: formatOddsValue(oddsNo),
  };
}

/**
 * Generate Over/Under odds
 * @param probabilities Match probabilities
 * @param margin Bookmaker margin
 * @param line Goal line (default: 2.5)
 * @returns Over/Under odds
 */
function generateOverUnderOdds(
  probabilities: MatchProbabilities,
  margin: number,
  line: number = 2.5
): {
  OVER: number;
  UNDER: number;
  line: number;
} {
  const overProb = probabilities.over_2_5;
  const underProb = probabilities.under_2_5;

  // Convert to fair odds
  const fairOddsOver = 1 / overProb;
  const fairOddsUnder = 1 / underProb;

  // Apply margin by reducing odds
  const marginFactor = 1 / (1 + margin);
  const oddsOver = fairOddsOver * marginFactor;
  const oddsUnder = fairOddsUnder * marginFactor;

  return {
    OVER: formatOddsValue(oddsOver),
    UNDER: formatOddsValue(oddsUnder),
    line,
  };
}

/**
 * Calculate probability of total goals over a line using Poisson distribution
 * @param homeExpectedGoals Home team expected goals
 * @param awayExpectedGoals Away team expected goals
 * @param line Goal line
 * @returns Probability of over
 */
function calculateOverProbability(
  homeExpectedGoals: number,
  awayExpectedGoals: number,
  line: number
): number {
  let overProb = 0;

  // Calculate all possible score combinations up to 10 goals each
  for (let homeGoals = 0; homeGoals <= 10; homeGoals++) {
    for (let awayGoals = 0; awayGoals <= 10; awayGoals++) {
      const totalGoals = homeGoals + awayGoals;

      if (totalGoals > line) {
        const probHomeGoals = poissonProbability(homeExpectedGoals, homeGoals);
        const probAwayGoals = poissonProbability(awayExpectedGoals, awayGoals);
        overProb += probHomeGoals * probAwayGoals;
      }
    }
  }

  return overProb;
}

/**
 * Calculate probability of both teams scoring using Poisson distribution
 * @param homeExpectedGoals Home team expected goals
 * @param awayExpectedGoals Away team expected goals
 * @returns Probability of both teams scoring
 */
function calculateBothTeamsScoreProbability(
  homeExpectedGoals: number,
  awayExpectedGoals: number
): number {
  // P(both score) = P(home >= 1) * P(away >= 1)
  // P(X >= 1) = 1 - P(X = 0)

  const probHomeScores = 1 - poissonProbability(homeExpectedGoals, 0);
  const probAwayScores = 1 - poissonProbability(awayExpectedGoals, 0);

  return probHomeScores * probAwayScores;
}

/**
 * Poisson probability mass function
 * @param lambda Expected value (λ)
 * @param k Number of occurrences
 * @returns Probability
 */
function poissonProbability(lambda: number, k: number): number {
  if (lambda <= 0 || k < 0) return 0;

  // P(X = k) = (λ^k * e^(-λ)) / k!
  const numerator = Math.pow(lambda, k) * Math.exp(-lambda);
  const denominator = factorial(k);

  return numerator / denominator;
}

/**
 * Calculate factorial
 * @param n Number
 * @returns n!
 */
function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * Validate generated odds
 * @param odds Match odds to validate
 * @returns Validation result
 */
export function validateOdds(odds: MatchOdds): OddsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate 1X2 odds
  const odds1X2Array = [odds['1X2']['1'], odds['1X2']['X'], odds['1X2']['2']];

  odds1X2Array.forEach((odd, index) => {
    if (odd < MIN_ODDS || odd > MAX_ODDS) {
      errors.push(`1X2 odds at index ${index} out of range: ${odd}`);
    }
    if (isNaN(odd)) {
      errors.push(`1X2 odds at index ${index} is NaN`);
    }
  });

  // Calculate and validate margin
  const margin = calculateMargin(odds1X2Array);

  if (margin < 0) {
    errors.push('Negative margin detected - arbitrage opportunity exists');
  }

  if (margin > 15) {
    warnings.push(`High margin detected: ${margin.toFixed(2)}% - odds may not be competitive`);
  }

  // Check for arbitrage
  const arbitrage = hasArbitrageOpportunity(odds1X2Array);

  if (arbitrage) {
    errors.push('Arbitrage opportunity detected in 1X2 market');
  }

  // Validate BTTS odds
  if (odds.BOTH_TEAMS_SCORE) {
    const oddsBTTS = [odds.BOTH_TEAMS_SCORE.YES, odds.BOTH_TEAMS_SCORE.NO];
    oddsBTTS.forEach((odd) => {
      if (odd < MIN_ODDS || odd > MAX_ODDS) {
        errors.push(`BTTS odds out of range: ${odd}`);
      }
    });
  }

  // Validate Over/Under odds
  if (odds.OVER_UNDER) {
    const oddsOU = [odds.OVER_UNDER.OVER, odds.OVER_UNDER.UNDER];
    oddsOU.forEach((odd) => {
      if (odd < MIN_ODDS || odd > MAX_ODDS) {
        errors.push(`Over/Under odds out of range: ${odd}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
    margin,
    hasArbitrage: arbitrage,
  };
}

/**
 * Apply manual adjustments to generated odds
 * @param odds Original odds
 * @param adjustments Percentage adjustments (-50 to 50)
 * @returns Adjusted odds
 */
export function applyManualAdjustments(
  odds: MatchOdds,
  adjustments: {
    home?: number;
    draw?: number;
    away?: number;
  }
): MatchOdds {
  const adjusted: MatchOdds = {...odds};

  if (adjustments.home) {
    const multiplier = 1 + adjustments.home / 100;
    adjusted['1X2']['1'] = Number((odds['1X2']['1'] * multiplier).toFixed(2));
  }

  if (adjustments.draw) {
    const multiplier = 1 + adjustments.draw / 100;
    adjusted['1X2']['X'] = Number((odds['1X2']['X'] * multiplier).toFixed(2));
  }

  if (adjustments.away) {
    const multiplier = 1 + adjustments.away / 100;
    adjusted['1X2']['2'] = Number((odds['1X2']['2'] * multiplier).toFixed(2));
  }

  return adjusted;
}

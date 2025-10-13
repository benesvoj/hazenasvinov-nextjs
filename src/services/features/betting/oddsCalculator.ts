import {BetStructure, CreateBetLegInput} from '@/types/features/betting/bet';
import {OddsFormat} from '@/types/features/betting/betType';

/**
 * Odds Calculator Service
 * Handles all odds-related calculations for the betting system
 */

/**
 * Calculate potential return from a single bet
 * @param stake Amount wagered
 * @param odds Decimal odds
 * @returns Potential return (stake * odds)
 */
export function calculateReturn(stake: number, odds: number): number {
  if (stake <= 0 || odds <= 0) return 0;
  return Number((stake * odds).toFixed(2));
}

/**
 * Calculate potential profit from a single bet
 * @param stake Amount wagered
 * @param odds Decimal odds
 * @returns Potential profit (return - stake)
 */
export function calculateProfit(stake: number, odds: number): number {
  if (stake <= 0 || odds <= 0) return 0;
  const returnAmount = calculateReturn(stake, odds);
  return Number((returnAmount - stake).toFixed(2));
}

/**
 * Calculate combined odds for accumulator bet (multiply all odds)
 * @param legs Array of bet legs with odds
 * @returns Combined decimal odds
 */
export function calculateAccumulatorOdds(legs: CreateBetLegInput[]): number {
  if (!legs || legs.length === 0) return 0;

  const combinedOdds = legs.reduce((acc, leg) => {
    return acc * leg.odds;
  }, 1);

  return Number(combinedOdds.toFixed(2));
}

/**
 * Calculate total odds for a bet based on structure
 * @param structure Type of bet (SINGLE, ACCUMULATOR, SYSTEM)
 * @param legs Array of bet legs
 * @returns Total odds
 */
export function calculateTotalOdds(structure: BetStructure, legs: CreateBetLegInput[]): number {
  if (!legs || legs.length === 0) return 0;

  switch (structure) {
    case 'SINGLE':
      return legs[0]?.odds || 0;

    case 'ACCUMULATOR':
      return calculateAccumulatorOdds(legs);

    case 'SYSTEM':
      // For system bets, return average odds (simplified)
      // In reality, system bets are more complex
      const avgOdds = legs.reduce((sum, leg) => sum + leg.odds, 0) / legs.length;
      return Number(avgOdds.toFixed(2));

    default:
      return 0;
  }
}

/**
 * Calculate implied probability from decimal odds
 * @param odds Decimal odds
 * @returns Probability percentage (0-100)
 */
export function calculateImpliedProbability(odds: number): number {
  if (odds <= 0) return 0;
  const probability = (1 / odds) * 100;
  return Number(probability.toFixed(2));
}

/**
 * Calculate the bookmaker's margin (overround)
 * @param oddsArray Array of all odds for a market (e.g., [2.0, 3.5, 4.0] for 1X2)
 * @returns Margin percentage
 */
export function calculateBookmakerMargin(oddsArray: number[]): number {
  if (!oddsArray || oddsArray.length === 0) return 0;

  const totalProbability = oddsArray.reduce((sum, odds) => {
    return sum + 1 / odds;
  }, 0);

  const margin = (totalProbability - 1) * 100;
  return Number(margin.toFixed(2));
}

/**
 * Convert decimal odds to fractional format
 * @param decimalOdds Decimal odds (e.g., 2.5)
 * @returns Fractional odds string (e.g., "3/2")
 */
export function convertToFractional(decimalOdds: number): string {
  if (decimalOdds <= 1) return '0/1';

  const profit = decimalOdds - 1;

  // Find greatest common divisor
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

  // Convert to fraction
  const precision = 100; // Multiply by 100 for precision
  let numerator = Math.round(profit * precision);
  let denominator = precision;

  const divisor = gcd(numerator, denominator);
  numerator = numerator / divisor;
  denominator = denominator / divisor;

  return `${numerator}/${denominator}`;
}

/**
 * Convert decimal odds to American format
 * @param decimalOdds Decimal odds
 * @returns American odds (e.g., +150 or -200)
 */
export function convertToAmerican(decimalOdds: number): string {
  if (decimalOdds <= 0) return '+0';

  if (decimalOdds >= 2) {
    // Positive American odds
    const americanOdds = Math.round((decimalOdds - 1) * 100);
    return `+${americanOdds}`;
  } else {
    // Negative American odds
    const americanOdds = Math.round(-100 / (decimalOdds - 1));
    return `${americanOdds}`;
  }
}

/**
 * Convert American odds to decimal format
 * @param americanOdds American odds (e.g., "+150" or "-200")
 * @returns Decimal odds
 */
export function convertAmericanToDecimal(americanOdds: string): number {
  const odds = parseFloat(americanOdds);

  if (odds >= 100) {
    // Positive American odds
    return Number((odds / 100 + 1).toFixed(2));
  } else {
    // Negative American odds
    return Number((100 / Math.abs(odds) + 1).toFixed(2));
  }
}

/**
 * Convert fractional odds to decimal format
 * @param fractionalOdds Fractional odds string (e.g., "3/2")
 * @returns Decimal odds
 */
export function convertFractionalToDecimal(fractionalOdds: string): number {
  const parts = fractionalOdds.split('/');
  if (parts.length !== 2) return 0;

  const numerator = parseFloat(parts[0]);
  const denominator = parseFloat(parts[1]);

  if (denominator === 0) return 0;

  const decimalOdds = numerator / denominator + 1;
  return Number(decimalOdds.toFixed(2));
}

/**
 * Format odds based on preferred format
 * @param decimalOdds Decimal odds
 * @param format Desired odds format
 * @returns Formatted odds string
 */
export function formatOdds(decimalOdds: number, format: OddsFormat = 'DECIMAL'): string {
  switch (format) {
    case 'DECIMAL':
      return decimalOdds.toFixed(2);
    case 'FRACTIONAL':
      return convertToFractional(decimalOdds);
    case 'AMERICAN':
      return convertToAmerican(decimalOdds);
    default:
      return decimalOdds.toFixed(2);
  }
}

/**
 * Calculate potential returns for system bet
 * @param stake Total stake
 * @param legs Array of bet legs
 * @param systemType System type (e.g., "3/4" means 3 from 4)
 * @returns Array of potential returns for each combination
 */
export function calculateSystemBetReturns(
  stake: number,
  legs: CreateBetLegInput[],
  systemType: string
): number[] {
  const [selectCount, totalCount] = systemType.split('/').map(Number);

  if (!selectCount || !totalCount || legs.length !== totalCount) {
    return [];
  }

  // Calculate all combinations
  const combinations = getCombinations(legs, selectCount);
  const stakePerBet = stake / combinations.length;

  // Calculate return for each combination
  return combinations.map((combo) => {
    const comboOdds = calculateAccumulatorOdds(combo);
    return calculateReturn(stakePerBet, comboOdds);
  });
}

/**
 * Get all combinations of k elements from array
 * Helper function for system bets
 */
function getCombinations<T>(array: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (array.length === 0) return [];

  const [first, ...rest] = array;

  // Combinations that include the first element
  const withFirst = getCombinations(rest, k - 1).map((combo) => [first, ...combo]);

  // Combinations that don't include the first element
  const withoutFirst = getCombinations(rest, k);

  return [...withFirst, ...withoutFirst];
}

/**
 * Validate odds value
 * @param odds Odds value to validate
 * @returns True if valid
 */
export function isValidOdds(odds: number): boolean {
  return odds > 0 && odds < 1000 && !isNaN(odds);
}

/**
 * Validate stake amount
 * @param stake Stake amount to validate
 * @param minStake Minimum allowed stake
 * @param maxStake Maximum allowed stake
 * @param balance User's current balance
 * @returns Validation result with error message if invalid
 */
export function validateStake(
  stake: number,
  minStake: number,
  maxStake: number,
  balance: number
): {isValid: boolean; error?: string} {
  if (isNaN(stake) || stake <= 0) {
    return {isValid: false, error: 'Stake must be greater than 0'};
  }

  if (stake < minStake) {
    return {isValid: false, error: `Minimum stake is ${minStake}`};
  }

  if (stake > maxStake) {
    return {isValid: false, error: `Maximum stake is ${maxStake}`};
  }

  if (stake > balance) {
    return {isValid: false, error: 'Insufficient balance'};
  }

  return {isValid: true};
}

/**
 * Calculate effective odds after cashout
 * @param originalOdds Original bet odds
 * @param currentProbability Current winning probability (0-1)
 * @returns Cashout odds
 */
export function calculateCashoutOdds(originalOdds: number, currentProbability: number): number {
  if (currentProbability <= 0 || currentProbability > 1) return 0;

  // Cashout odds are typically lower than full odds
  // This is a simplified calculation
  const impliedOdds = 1 / currentProbability;
  const cashoutMargin = 0.9; // 10% margin for bookmaker
  const cashoutOdds = impliedOdds * cashoutMargin;

  return Number(cashoutOdds.toFixed(2));
}

/**
 * Calculate potential cashout value
 * @param stake Original stake
 * @param originalOdds Original odds
 * @param currentProbability Current winning probability
 * @returns Cashout value
 */
export function calculateCashoutValue(
  stake: number,
  originalOdds: number,
  currentProbability: number
): number {
  const cashoutOdds = calculateCashoutOdds(originalOdds, currentProbability);
  return calculateReturn(stake, cashoutOdds);
}

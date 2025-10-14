const MIN_ODDS = 1.01;
const MAX_ODDS = 100.0;

export const formatOddsValue = (odds: number): number =>
  Number(Math.max(MIN_ODDS, Math.min(MAX_ODDS, odds)).toFixed(2));

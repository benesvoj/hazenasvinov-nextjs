import {TournamentMatch} from '@/types';

export function formatScore(match: TournamentMatch): string {
  if (match.home_score === null || match.away_score === null) return '— : —';
  return `${match.home_score} : ${match.away_score}`;
}

export function formatHalftime(match: TournamentMatch): string | null {
  if (match.home_score_halftime === null || match.away_score_halftime === null) return null;
  return `(${match.home_score_halftime}:${match.away_score_halftime})`;
}

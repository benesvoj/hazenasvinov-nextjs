import {describe, it, expect} from 'vitest';

import {TournamentMatch} from '@/types';

import {formatScore, formatHalftime} from '../formatTournamentScore';

const makeMatch = (
  overrides: Partial<
    Pick<
      TournamentMatch,
      'home_score' | 'away_score' | 'home_score_halftime' | 'away_score_halftime'
    >
  > = {}
): TournamentMatch =>
  ({
    id: 'match-1',
    home_score: overrides.home_score ?? null,
    away_score: overrides.away_score ?? null,
    home_score_halftime: overrides.home_score_halftime ?? null,
    away_score_halftime: overrides.away_score_halftime ?? null,
  }) as TournamentMatch;

describe('formatScore', () => {
  it('should format score when both values present', () => {
    const match = makeMatch({home_score: 3, away_score: 1});
    expect(formatScore(match)).toBe('3 : 1');
  });

  it('should return placeholder when home_score is null', () => {
    const match = makeMatch({home_score: null, away_score: 2});
    expect(formatScore(match)).toBe('— : —');
  });

  it('should return placeholder when away_score is null', () => {
    const match = makeMatch({home_score: 2, away_score: null});
    expect(formatScore(match)).toBe('— : —');
  });

  it('should return placeholder when both scores are null', () => {
    const match = makeMatch();
    expect(formatScore(match)).toBe('— : —');
  });

  it('should handle zero scores', () => {
    const match = makeMatch({home_score: 0, away_score: 0});
    expect(formatScore(match)).toBe('0 : 0');
  });
});

describe('formatHalftime', () => {
  it('should format halftime score when both values present', () => {
    const match = makeMatch({home_score_halftime: 1, away_score_halftime: 0});
    expect(formatHalftime(match)).toBe('(1:0)');
  });

  it('should return null when home_score_halftime is null', () => {
    const match = makeMatch({home_score_halftime: null, away_score_halftime: 2});
    expect(formatHalftime(match)).toBeNull();
  });

  it('should return null when away_score_halftime is null', () => {
    const match = makeMatch({home_score_halftime: 1, away_score_halftime: null});
    expect(formatHalftime(match)).toBeNull();
  });

  it('should return null when both halftime scores are null', () => {
    const match = makeMatch();
    expect(formatHalftime(match)).toBeNull();
  });

  it('should handle zero halftime scores', () => {
    const match = makeMatch({home_score_halftime: 0, away_score_halftime: 0});
    expect(formatHalftime(match)).toBe('(0:0)');
  });
});

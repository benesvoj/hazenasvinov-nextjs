import {describe, expect, it} from 'vitest';

import {calculateDynamicDrawProbability} from '@/services/features/betting/oddsGeneratorService';

import {TeamStats} from '@/types';

/** Builds a TeamStats with only the fields the draw calculation reads. */
const team = (over: Partial<TeamStats> = {}): TeamStats =>
  ({
    team_id: 'team',
    matches_played: 20,
    wins: 8,
    draws: 4,
    losses: 8,
    goals_scored: 600,
    goals_conceded: 600,
    home_record: {
      matches: 10,
      wins: 4,
      draws: 2,
      losses: 4,
      goals_scored: 300,
      goals_conceded: 300,
    },
    away_record: {
      matches: 10,
      wins: 4,
      draws: 2,
      losses: 4,
      goals_scored: 300,
      goals_conceded: 300,
    },
    ...over,
  }) as TeamStats;

const MIN = 0.15;
const MAX = 0.4;

describe('calculateDynamicDrawProbability', () => {
  describe('strength difference', () => {
    it('rates an even match more likely to draw than a mismatch', () => {
      const even = calculateDynamicDrawProbability(50, 50, team(), team());
      const mismatch = calculateDynamicDrawProbability(90, 10, team(), team());

      expect(even).toBeGreaterThan(mismatch);
    });

    it('falls monotonically as the gap widens', () => {
      const gaps = [0, 10, 20, 40, 80].map((gap) =>
        calculateDynamicDrawProbability(50 + gap, 50, team(), team())
      );

      for (let i = 1; i < gaps.length; i++) {
        expect(gaps[i]).toBeLessThan(gaps[i - 1]);
      }
    });

    it('does not care which side is the favourite', () => {
      const homeFavoured = calculateDynamicDrawProbability(80, 40, team(), team());
      const awayFavoured = calculateDynamicDrawProbability(40, 80, team(), team());

      expect(homeFavoured).toBeCloseTo(awayFavoured, 12);
    });
  });

  describe('historical draw rate', () => {
    it('rates sides that draw often as more likely to draw again', () => {
      const drawish = team({matches_played: 20, draws: 14});
      const decisive = team({matches_played: 20, draws: 0});

      expect(calculateDynamicDrawProbability(50, 50, drawish, drawish)).toBeGreaterThan(
        calculateDynamicDrawProbability(50, 50, decisive, decisive)
      );
    });
  });

  describe('defence', () => {
    it('rates two tight defences above two leaky ones', () => {
      const tight = team({matches_played: 20, goals_conceded: 10, draws: 0});
      const leaky = team({matches_played: 20, goals_conceded: 200, draws: 0});

      expect(calculateDynamicDrawProbability(50, 50, tight, tight)).toBeGreaterThan(
        calculateDynamicDrawProbability(50, 50, leaky, leaky)
      );
    });
  });

  describe('bounds', () => {
    it('stays inside the band for the extremes in both directions', () => {
      const everythingDraws = team({matches_played: 20, draws: 20, goals_conceded: 0});
      const nothingDraws = team({matches_played: 20, draws: 0, goals_conceded: 2000});

      expect(
        calculateDynamicDrawProbability(50, 50, everythingDraws, everythingDraws)
      ).toBeLessThanOrEqual(MAX);
      expect(
        calculateDynamicDrawProbability(1000, 0, nothingDraws, nothingDraws)
      ).toBeGreaterThanOrEqual(MIN);
    });

    it('stays inside the band across a sweep of inputs', () => {
      for (let gap = 0; gap <= 200; gap += 10) {
        for (const draws of [0, 5, 10, 20]) {
          const t = team({matches_played: 20, draws});
          const p = calculateDynamicDrawProbability(50 + gap, 50, t, t);

          expect(p).toBeGreaterThanOrEqual(MIN);
          expect(p).toBeLessThanOrEqual(MAX);
        }
      }
    });
  });

  describe('teams with no matches yet', () => {
    // Runs before the first round of a season: matches_played is 0 and the
    // divisions would be 0/0 without the floor.
    it('returns a number rather than NaN', () => {
      const fresh = team({matches_played: 0, draws: 0, goals_scored: 0, goals_conceded: 0});
      const p = calculateDynamicDrawProbability(50, 50, fresh, fresh);

      expect(Number.isNaN(p)).toBe(false);
      expect(p).toBeGreaterThanOrEqual(MIN);
      expect(p).toBeLessThanOrEqual(MAX);
    });
  });
});

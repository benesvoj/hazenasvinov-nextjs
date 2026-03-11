import {describe, expect, it} from 'vitest';

import {generateRoundRobin} from '../roundRobinGenerator';

function makeTeams(n: number) {
  return Array.from({length: n}, (_, i) => ({
    team_id: `team-${i + 1}`,
    seed_order: i + 1,
  }));
}

function uniquePairs(matches: Array<{home_team_id: string; away_team_id: string}>) {
  return new Set(matches.map((m) => [m.home_team_id, m.away_team_id].sort().join('-')));
}

describe('generateRoundRobin', () => {
  // --- Correct match counts ---

  it('generates 6 matches in 3 rounds for 4 teams', () => {
    const result = generateRoundRobin({teams: makeTeams(4)});

    expect(result.matches).toHaveLength(6);
    expect(result.rounds).toBe(3);
    expect(result.hasByes).toBe(false);
  });

  it('generates 10 matches in 5 rounds for 5 teams (odd, with byes)', () => {
    const result = generateRoundRobin({teams: makeTeams(5)});

    expect(result.matches).toHaveLength(10);
    expect(result.rounds).toBe(5);
    expect(result.hasByes).toBe(true);
  });

  it('generates 15 matches in 5 rounds for 6 teams', () => {
    const result = generateRoundRobin({teams: makeTeams(6)});

    expect(result.matches).toHaveLength(15);
    expect(result.rounds).toBe(5);
    expect(result.hasByes).toBe(false);
  });

  it('generates 3 matches in 3 rounds for 3 teams (minimum)', () => {
    const result = generateRoundRobin({teams: makeTeams(3)});

    expect(result.matches).toHaveLength(3);
    expect(result.rounds).toBe(3);
    expect(result.hasByes).toBe(true);
  });

  it('generates 28 matches in 7 rounds for 8 teams', () => {
    const result = generateRoundRobin({teams: makeTeams(8)});

    expect(result.matches).toHaveLength(28);
    expect(result.rounds).toBe(7);
  });

  it('generates 66 matches in 11 rounds for 12 teams', () => {
    const result = generateRoundRobin({teams: makeTeams(12)});

    expect(result.matches).toHaveLength(66);
    expect(result.rounds).toBe(11);
  });

  // --- Each pair plays exactly once ---

  it.each([3, 4, 5, 6, 7, 8, 10, 12])('each pair plays exactly once with %i teams', (n) => {
    const result = generateRoundRobin({teams: makeTeams(n)});
    const expectedPairs = (n * (n - 1)) / 2;
    const pairs = uniquePairs(result.matches);

    expect(pairs.size).toBe(expectedPairs);
    expect(result.matches).toHaveLength(expectedPairs);
  });

  // --- No self-matches ---

  it('never produces a match where a team plays itself', () => {
    const result = generateRoundRobin({teams: makeTeams(8)});

    result.matches.forEach((m) => {
      expect(m.home_team_id).not.toBe(m.away_team_id);
    });
  });

  // --- Valid round numbers ---

  it('assigns round numbers from 1 to rounds', () => {
    const result = generateRoundRobin({teams: makeTeams(6)});

    result.matches.forEach((m) => {
      expect(m.round).toBeGreaterThanOrEqual(1);
      expect(m.round).toBeLessThanOrEqual(result.rounds);
    });
  });

  // --- Each team plays at most once per round ---

  it.each([4, 5, 6, 8])('each team plays at most once per round with %i teams', (n) => {
    const result = generateRoundRobin({teams: makeTeams(n)});

    for (let round = 1; round <= result.rounds; round++) {
      const roundMatches = result.matches.filter((m) => m.round === round);
      const teamsInRound = new Set<string>();

      roundMatches.forEach((m) => {
        expect(teamsInRound.has(m.home_team_id)).toBe(false);
        expect(teamsInRound.has(m.away_team_id)).toBe(false);
        teamsInRound.add(m.home_team_id);
        teamsInRound.add(m.away_team_id);
      });
    }
  });

  // --- Seed order respected ---

  it('gives home advantage to higher seed in first meeting', () => {
    const teams = [
      {team_id: 'seed1', seed_order: 1},
      {team_id: 'seed2', seed_order: 2},
      {team_id: 'seed3', seed_order: 3},
      {team_id: 'seed4', seed_order: 4},
    ];
    const result = generateRoundRobin({teams});

    // Seed 1 vs Seed 2: seed 1 should be home
    const match = result.matches.find(
      (m) =>
        (m.home_team_id === 'seed1' && m.away_team_id === 'seed2') ||
        (m.home_team_id === 'seed2' && m.away_team_id === 'seed1')
    );

    expect(match).toBeDefined();
    expect(match!.home_team_id).toBe('seed1');
  });

  it('sorts teams by seed_order regardless of input order', () => {
    const teams = [
      {team_id: 'c', seed_order: 3},
      {team_id: 'a', seed_order: 1},
      {team_id: 'b', seed_order: 2},
      {team_id: 'd', seed_order: 4},
    ];
    const result = generateRoundRobin({teams});

    // Team 'a' (seed 1) is fixed, so it appears in every round
    for (let round = 1; round <= result.rounds; round++) {
      const roundMatches = result.matches.filter((m) => m.round === round);
      const teamsInRound = roundMatches.flatMap((m) => [m.home_team_id, m.away_team_id]);
      expect(teamsInRound).toContain('a');
    }
  });

  // --- Error cases ---

  it('throws error for fewer than 3 teams', () => {
    expect(() =>
      generateRoundRobin({
        teams: [
          {team_id: 'a', seed_order: 1},
          {team_id: 'b', seed_order: 2},
        ],
      })
    ).toThrow('Round-robin vyžaduje alespoň 3 týmy');
  });

  it('throws error for 1 team', () => {
    expect(() => generateRoundRobin({teams: [{team_id: 'a', seed_order: 1}]})).toThrow();
  });

  it('throws error for empty teams', () => {
    expect(() => generateRoundRobin({teams: []})).toThrow();
  });
});

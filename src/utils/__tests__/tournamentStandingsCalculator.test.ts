import {describe, expect, it} from 'vitest';

import {
  ComputedStanding,
  TournamentMatchForStandings,
  computeTournamentStandings,
} from '../tournamentStandingsCalculator';

const TEAMS = ['team-A', 'team-B', 'team-C', 'team-D'];

function findTeam(standings: ComputedStanding[], teamId: string) {
  return standings.find((s) => s.team_id === teamId)!;
}

describe('computeTournamentStandings', () => {
  // --- Empty / edge cases ---

  it('returns empty array for no teams', () => {
    expect(computeTournamentStandings([], [])).toEqual([]);
  });

  it('returns all-zero standings when no matches played', () => {
    const standings = computeTournamentStandings(TEAMS, []);

    expect(standings).toHaveLength(4);
    standings.forEach((s) => {
      expect(s.matches).toBe(0);
      expect(s.wins).toBe(0);
      expect(s.draws).toBe(0);
      expect(s.losses).toBe(0);
      expect(s.goals_for).toBe(0);
      expect(s.goals_against).toBe(0);
      expect(s.points).toBe(0);
    });
  });

  it('assigns positions 1-N even with zero matches', () => {
    const standings = computeTournamentStandings(TEAMS, []);
    const positions = standings.map((s) => s.position).sort();

    expect(positions).toEqual([1, 2, 3, 4]);
  });

  // --- Single match ---

  it('awards 2 points for a win, 0 for a loss', () => {
    const matches: TournamentMatchForStandings[] = [
      {home_team_id: 'team-A', away_team_id: 'team-B', home_score: 3, away_score: 1},
    ];
    const standings = computeTournamentStandings(TEAMS, matches);
    const a = findTeam(standings, 'team-A');
    const b = findTeam(standings, 'team-B');

    expect(a.points).toBe(2);
    expect(a.wins).toBe(1);
    expect(a.losses).toBe(0);
    expect(b.points).toBe(0);
    expect(b.wins).toBe(0);
    expect(b.losses).toBe(1);
  });

  it('awards 1 point each for a draw', () => {
    const matches: TournamentMatchForStandings[] = [
      {home_team_id: 'team-A', away_team_id: 'team-B', home_score: 2, away_score: 2},
    ];
    const standings = computeTournamentStandings(TEAMS, matches);
    const a = findTeam(standings, 'team-A');
    const b = findTeam(standings, 'team-B');

    expect(a.points).toBe(1);
    expect(a.draws).toBe(1);
    expect(b.points).toBe(1);
    expect(b.draws).toBe(1);
  });

  // --- Goal tracking ---

  it('tracks goals_for and goals_against correctly', () => {
    const matches: TournamentMatchForStandings[] = [
      {home_team_id: 'team-A', away_team_id: 'team-B', home_score: 5, away_score: 2},
    ];
    const standings = computeTournamentStandings(TEAMS, matches);
    const a = findTeam(standings, 'team-A');
    const b = findTeam(standings, 'team-B');

    expect(a.goals_for).toBe(5);
    expect(a.goals_against).toBe(2);
    expect(b.goals_for).toBe(2);
    expect(b.goals_against).toBe(5);
  });

  it('accumulates goals across multiple matches', () => {
    const matches: TournamentMatchForStandings[] = [
      {home_team_id: 'team-A', away_team_id: 'team-B', home_score: 3, away_score: 1},
      {home_team_id: 'team-A', away_team_id: 'team-C', home_score: 2, away_score: 0},
    ];
    const standings = computeTournamentStandings(TEAMS, matches);
    const a = findTeam(standings, 'team-A');

    expect(a.matches).toBe(2);
    expect(a.goals_for).toBe(5);
    expect(a.goals_against).toBe(1);
  });

  // --- Sorting ---

  it('sorts by points descending', () => {
    const matches: TournamentMatchForStandings[] = [
      {home_team_id: 'team-A', away_team_id: 'team-B', home_score: 1, away_score: 0},
      {home_team_id: 'team-C', away_team_id: 'team-D', home_score: 1, away_score: 0},
      {home_team_id: 'team-A', away_team_id: 'team-C', home_score: 1, away_score: 0},
    ];
    const standings = computeTournamentStandings(TEAMS, matches);

    // A: 4pts, C: 2pts, B: 0pts, D: 0pts
    expect(standings[0].team_id).toBe('team-A');
    expect(standings[0].points).toBe(4);
    expect(standings[1].team_id).toBe('team-C');
    expect(standings[1].points).toBe(2);
  });

  it('breaks tie by goal difference', () => {
    const matches: TournamentMatchForStandings[] = [
      // Both A and B win one match each (2pts)
      {home_team_id: 'team-A', away_team_id: 'team-C', home_score: 5, away_score: 1}, // A: GD +4
      {home_team_id: 'team-B', away_team_id: 'team-D', home_score: 2, away_score: 1}, // B: GD +1
    ];
    const standings = computeTournamentStandings(TEAMS, matches);

    // Both 2pts, but A has better GD (+4 vs +1)
    expect(standings[0].team_id).toBe('team-A');
    expect(standings[1].team_id).toBe('team-B');
  });

  it('breaks tie by goals scored when goal difference is equal', () => {
    const matches: TournamentMatchForStandings[] = [
      // Both win by 2 goals, but A scored more
      {home_team_id: 'team-A', away_team_id: 'team-C', home_score: 4, away_score: 2}, // A: GD +2, GF 4
      {home_team_id: 'team-B', away_team_id: 'team-D', home_score: 3, away_score: 1}, // B: GD +2, GF 3
    ];
    const standings = computeTournamentStandings(TEAMS, matches);

    // Same pts (2), same GD (+2), A scored more (4 vs 3)
    expect(standings[0].team_id).toBe('team-A');
    expect(standings[1].team_id).toBe('team-B');
  });

  // --- Full tournament simulation ---

  it('calculates correct standings for a complete 4-team round-robin', () => {
    // 6 matches: every pair plays once
    const matches: TournamentMatchForStandings[] = [
      {home_team_id: 'team-A', away_team_id: 'team-B', home_score: 3, away_score: 1}, // A wins
      {home_team_id: 'team-A', away_team_id: 'team-C', home_score: 2, away_score: 2}, // Draw
      {home_team_id: 'team-A', away_team_id: 'team-D', home_score: 1, away_score: 0}, // A wins
      {home_team_id: 'team-B', away_team_id: 'team-C', home_score: 0, away_score: 1}, // C wins
      {home_team_id: 'team-B', away_team_id: 'team-D', home_score: 2, away_score: 2}, // Draw
      {home_team_id: 'team-C', away_team_id: 'team-D', home_score: 3, away_score: 0}, // C wins
    ];
    const standings = computeTournamentStandings(TEAMS, matches);

    // A: W2 D1 L0 = 5pts, GF 6 GA 3, GD +3
    const a = findTeam(standings, 'team-A');
    expect(a.matches).toBe(3);
    expect(a.wins).toBe(2);
    expect(a.draws).toBe(1);
    expect(a.losses).toBe(0);
    expect(a.points).toBe(5);
    expect(a.goals_for).toBe(6);
    expect(a.goals_against).toBe(3);

    // B: W0 D1 L2 = 1pt, GF 3 GA 6, GD -3
    const b = findTeam(standings, 'team-B');
    expect(b.matches).toBe(3);
    expect(b.wins).toBe(0);
    expect(b.draws).toBe(1);
    expect(b.losses).toBe(2);
    expect(b.points).toBe(1);
    expect(b.goals_for).toBe(3);
    expect(b.goals_against).toBe(6);

    // C: W2 D1 L0 = 5pts, GF 6 GA 2, GD +4
    const c = findTeam(standings, 'team-C');
    expect(c.matches).toBe(3);
    expect(c.wins).toBe(2);
    expect(c.draws).toBe(1);
    expect(c.losses).toBe(0);
    expect(c.points).toBe(5);
    expect(c.goals_for).toBe(6);
    expect(c.goals_against).toBe(2);

    // D: W0 D1 L2 = 1pt, GF 2 GA 6, GD -4
    const d = findTeam(standings, 'team-D');
    expect(d.matches).toBe(3);
    expect(d.wins).toBe(0);
    expect(d.draws).toBe(1);
    expect(d.losses).toBe(2);
    expect(d.points).toBe(1);
    expect(d.goals_for).toBe(2);
    expect(d.goals_against).toBe(6);

    // Positions: C (5pts, GD+4) > A (5pts, GD+3) > B (1pt, GD-3) > D (1pt, GD-4)
    expect(standings[0].team_id).toBe('team-C');
    expect(standings[0].position).toBe(1);
    expect(standings[1].team_id).toBe('team-A');
    expect(standings[1].position).toBe(2);
    expect(standings[2].team_id).toBe('team-B');
    expect(standings[2].position).toBe(3);
    expect(standings[3].team_id).toBe('team-D');
    expect(standings[3].position).toBe(4);
  });

  // --- Consistency invariants ---

  it('total wins + draws + losses equals matches for each team', () => {
    const matches: TournamentMatchForStandings[] = [
      {home_team_id: 'team-A', away_team_id: 'team-B', home_score: 3, away_score: 1},
      {home_team_id: 'team-A', away_team_id: 'team-C', home_score: 2, away_score: 2},
      {home_team_id: 'team-B', away_team_id: 'team-C', home_score: 0, away_score: 1},
    ];
    const standings = computeTournamentStandings(['team-A', 'team-B', 'team-C'], matches);

    standings.forEach((s) => {
      expect(s.wins + s.draws + s.losses).toBe(s.matches);
    });
  });

  it('points equal 2*wins + draws', () => {
    const matches: TournamentMatchForStandings[] = [
      {home_team_id: 'team-A', away_team_id: 'team-B', home_score: 3, away_score: 1},
      {home_team_id: 'team-A', away_team_id: 'team-C', home_score: 2, away_score: 2},
      {home_team_id: 'team-B', away_team_id: 'team-C', home_score: 0, away_score: 1},
    ];
    const standings = computeTournamentStandings(['team-A', 'team-B', 'team-C'], matches);

    standings.forEach((s) => {
      expect(s.points).toBe(2 * s.wins + s.draws);
    });
  });

  it('total goals scored equals total goals conceded across all teams', () => {
    const matches: TournamentMatchForStandings[] = [
      {home_team_id: 'team-A', away_team_id: 'team-B', home_score: 3, away_score: 1},
      {home_team_id: 'team-C', away_team_id: 'team-D', home_score: 2, away_score: 0},
      {home_team_id: 'team-A', away_team_id: 'team-C', home_score: 1, away_score: 1},
    ];
    const standings = computeTournamentStandings(TEAMS, matches);

    const totalGF = standings.reduce((sum, s) => sum + s.goals_for, 0);
    const totalGA = standings.reduce((sum, s) => sum + s.goals_against, 0);
    expect(totalGF).toBe(totalGA);
  });

  // --- Edge cases ---

  it('handles 0-0 draws correctly', () => {
    const matches: TournamentMatchForStandings[] = [
      {home_team_id: 'team-A', away_team_id: 'team-B', home_score: 0, away_score: 0},
    ];
    const standings = computeTournamentStandings(['team-A', 'team-B'], matches);
    const a = findTeam(standings, 'team-A');
    const b = findTeam(standings, 'team-B');

    expect(a.draws).toBe(1);
    expect(a.points).toBe(1);
    expect(a.goals_for).toBe(0);
    expect(b.draws).toBe(1);
    expect(b.points).toBe(1);
    expect(b.goals_for).toBe(0);
  });

  it('ignores matches with unknown team IDs', () => {
    const matches: TournamentMatchForStandings[] = [
      {home_team_id: 'team-A', away_team_id: 'unknown', home_score: 3, away_score: 0},
    ];
    const standings = computeTournamentStandings(TEAMS, matches);
    const a = findTeam(standings, 'team-A');

    // Match should be skipped — unknown away team
    expect(a.matches).toBe(0);
    expect(a.points).toBe(0);
  });

  it('handles single team with no matches', () => {
    const standings = computeTournamentStandings(['team-A'], []);

    expect(standings).toHaveLength(1);
    expect(standings[0].team_id).toBe('team-A');
    expect(standings[0].position).toBe(1);
    expect(standings[0].points).toBe(0);
  });

  it('handles high-scoring match', () => {
    const matches: TournamentMatchForStandings[] = [
      {home_team_id: 'team-A', away_team_id: 'team-B', home_score: 15, away_score: 12},
    ];
    const standings = computeTournamentStandings(['team-A', 'team-B'], matches);
    const a = findTeam(standings, 'team-A');

    expect(a.goals_for).toBe(15);
    expect(a.goals_against).toBe(12);
    expect(a.points).toBe(2);
  });

  // --- Away team wins ---

  it('correctly handles away team win', () => {
    const matches: TournamentMatchForStandings[] = [
      {home_team_id: 'team-A', away_team_id: 'team-B', home_score: 1, away_score: 3},
    ];
    const standings = computeTournamentStandings(['team-A', 'team-B'], matches);
    const a = findTeam(standings, 'team-A');
    const b = findTeam(standings, 'team-B');

    expect(a.losses).toBe(1);
    expect(a.points).toBe(0);
    expect(b.wins).toBe(1);
    expect(b.points).toBe(2);
    expect(standings[0].team_id).toBe('team-B'); // winner is 1st
  });
});

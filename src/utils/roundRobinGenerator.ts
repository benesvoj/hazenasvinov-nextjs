interface RoundRobinMatch {
  home_team_id: string;
  away_team_id: string;
  round: number;
}

interface GenerateRoundRobinOptions {
  teams: Array<{team_id: string; seed_order: number}>;
}

interface GenerateRoundRobinResult {
  matches: RoundRobinMatch[];
  rounds: number;
  hasByes: boolean;
}

const BYE_TEAM_ID = 'BYE';

/**
 * Predefined match keys per team count.
 * Each entry is [home_seed, away_seed] grouped by round.
 * Seeds are 1-based and map to teams sorted by seed_order.
 */
const MATCH_KEYS: Record<number, [number, number][][]> = {
  6: [
    // Round 1
    [
      [3, 6],
      [5, 1],
      [2, 4],
    ],
    // Round 2
    [
      [6, 1],
      [2, 3],
      [4, 5],
    ],
    // Round 3
    [
      [6, 2],
      [1, 4],
      [3, 5],
    ],
    // Round 4
    [
      [4, 6],
      [2, 5],
      [1, 3],
    ],
    // Round 5
    [
      [5, 6],
      [3, 4],
      [1, 2],
    ],
  ],
};

/**
 * Generate a round-robin schedule.
 * Uses a predefined match key when available (currently 6 teams),
 * otherwise falls back to the circle method.
 *
 * @throws Error if fewer than 3 teams are provided
 */
export function generateRoundRobin(options: GenerateRoundRobinOptions): GenerateRoundRobinResult {
  const {teams} = options;
  const numTeams = teams.length;

  if (numTeams < 3) {
    throw new Error('Round-robin vyžaduje alespoň 3 týmy');
  }

  // Sort by seed_order to respect seeding
  const sorted = [...teams].sort((a, b) => a.seed_order - b.seed_order);
  const teamIds = sorted.map((team) => team.team_id);

  const key = MATCH_KEYS[numTeams];
  if (key) {
    return generateFromKey(teamIds, key);
  }

  return generateCircleMethod(teamIds);
}

/**
 * Generate matches from a predefined match key.
 * Seeds in the key are 1-based indices into the sorted teamIds array.
 */
function generateFromKey(teamIds: string[], key: [number, number][][]): GenerateRoundRobinResult {
  const matches: RoundRobinMatch[] = [];

  for (let round = 0; round < key.length; round++) {
    for (const [homeSeed, awaySeed] of key[round]) {
      matches.push({
        home_team_id: teamIds[homeSeed - 1],
        away_team_id: teamIds[awaySeed - 1],
        round: round + 1,
      });
    }
  }

  return {
    matches,
    rounds: key.length,
    hasByes: false,
  };
}

/**
 * Fallback: circle method for team counts without a predefined key.
 */
function generateCircleMethod(teamIds: string[]): GenerateRoundRobinResult {
  const hasByes = teamIds.length % 2 !== 0;

  if (hasByes) {
    teamIds = [...teamIds, BYE_TEAM_ID];
  }

  const totalSlots = teamIds.length;
  const rounds = totalSlots - 1;
  const matches: RoundRobinMatch[] = [];

  const fixed = teamIds[0];
  const rotating = teamIds.slice(1);

  for (let round = 0; round < rounds; round++) {
    const current = [fixed, ...rotating];

    for (let i = 0; i < totalSlots / 2; i++) {
      const homeTeamId = current[i];
      const awayTeamId = current[totalSlots - 1 - i];

      if (homeTeamId !== BYE_TEAM_ID && awayTeamId !== BYE_TEAM_ID) {
        matches.push({
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          round: round + 1,
        });
      }
    }

    rotating.unshift(rotating.pop()!);
  }

  return {
    matches,
    rounds,
    hasByes,
  };
}

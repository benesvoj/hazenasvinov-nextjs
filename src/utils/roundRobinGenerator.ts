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
 * Generate a round-robin schedule using the circle method.
 * Fixes team[0] and rotates the remaining teams each round.
 *
 * @throws Error if fewer than 3 teams are provided
 */
export function generateRoundRobin(options: GenerateRoundRobinOptions): GenerateRoundRobinResult {
  const {teams} = options;
  const numTeams = teams.length;

  if (numTeams < 3) {
    throw new Error('Round-robin vyžaduje alespoň 3 týmy');
  }

  const hasByes = numTeams % 2 !== 0;

  // Sort by seed_order to respect seeding
  const sorted = [...teams].sort((a, b) => a.seed_order - b.seed_order);
  const teamIds = sorted.map((team) => team.team_id);

  // If odd number of teams, add a BYE so pairing works evenly
  if (hasByes) {
    teamIds.push(BYE_TEAM_ID);
  }

  const totalSlots = teamIds.length;
  const rounds = totalSlots - 1;
  const matches: RoundRobinMatch[] = [];

  // Circle method: fix first team, rotate the rest
  const fixed = teamIds[0];
  const rotating = teamIds.slice(1);

  for (let round = 0; round < rounds; round++) {
    const current = [fixed, ...rotating];

    for (let i = 0; i < totalSlots / 2; i++) {
      const homeTeamId = current[i];
      const awayTeamId = current[totalSlots - 1 - i];

      // Skip matches involving the BYE team
      if (homeTeamId !== BYE_TEAM_ID && awayTeamId !== BYE_TEAM_ID) {
        matches.push({
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          round: round + 1,
        });
      }
    }

    // Rotate: move last element to front of rotating array
    rotating.unshift(rotating.pop()!);
  }

  return {
    matches,
    rounds,
    hasByes,
  };
}

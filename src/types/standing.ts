export interface Standing {
    position: number;
    team: string;
    team_logo: string;
    is_own_club?: boolean;
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    points: number;
  }
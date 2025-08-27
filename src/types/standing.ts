export interface Standing {
    id: string;
    team_id?: string;
    club_id?: string;
    category_id: string;
    season_id: string;
    position: number;
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    points: number;
    club?: {
      id: string;
      name: string;
      short_name?: string;
      logo_url?: string;
    };
    team?: {
      id: string;
      name: string;
      short_name?: string;
      logo_url?: string;
      team_suffix?: string;
    };
  }
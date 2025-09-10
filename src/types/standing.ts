import { Club } from './clubs';

export interface Standing {
    id?: string;
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
    club?: Club;
    team?: {
      id: string;
      name: string;
      short_name?: string;
      logo_url?: string;
      team_suffix?: string;
    };
  }

// Types for the Supabase query results
export interface ClubCategoryTeam {
  id: string;
  team_suffix: string;
  club_category: {
    club: Club;
  };
}

export interface StandingWithTeam {
  id: string;
  team_id: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
  position: number;
  team: ClubCategoryTeam;
}

export interface ProcessedStanding {
  id: string;
  team_id: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
  position: number;
  team: {
    id: string;
    name: string;
    shortName: string;
    displayName: string;
    shortDisplayName: string;
    logo_url?: string;
  };
}
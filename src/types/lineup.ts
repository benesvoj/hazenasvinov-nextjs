import {LineupErrorType, TeamTypes} from '@/enums';
import {LineupCoach, LineupPlayer, LineupCoachFormData, Match} from './';
export interface Lineup {
  id: string;
  match_id: string;
  team_id: string;
  is_home_team: boolean;
  created_at: string;
  updated_at: string;
}

export interface LineupSummary {
  total_players: number;
  goalkeepers: number;
  field_players: number;
  coaches: number;
  is_valid: boolean;
}

export interface LineupFormData {
  match_id: string;
  team_id: string;
  is_home_team: boolean;
  players: LineupPlayerFormData[];
  coaches: LineupCoachFormData[];
}

export interface LineupPlayerFormData {
  member_id?: string;
  name?: string;
  surname?: string;
  registration_number?: string;
  display_name?: string;
  /* Goalkeeper or field player */
  position: string;
  is_captain?: boolean;
  /* Jersey number */
  jersey_number?: number;
  goals?: number;
  yellow_cards?: number;
  red_cards_5min?: number;
  red_cards_10min?: number;
  red_cards_personal?: number;
}

export interface LineupValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface LineupError {
  type: LineupErrorType;
  message: string;
  code?: string;
}

export interface LineupCardProps {
  match: Match;
  lineup: {
    players: LineupPlayer[];
    coaches: LineupCoach[];
  } | null;
  lineupLoading: boolean;
  teamType: TeamTypes;
}

export interface LineupSummary {
  total_players: number;
  goalkeepers: number;
  field_players: number;
  coaches: number;
  is_valid: boolean;
}

export interface LineupFormData {
  match_id: string;
  team_id: string;
  is_home_team: boolean;
  players: LineupPlayerFormData[];
  coaches: LineupCoachFormData[];
}

export interface LineupValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

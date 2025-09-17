import {MatchStatus} from './match';

export interface AddMatchFormData {
  date: string;
  time: string;
  home_team_id: string;
  away_team_id: string;
  venue?: string;
  category_id: string;
  season_id: string;
  matchweek?: number;
  match_number?: number;
  video_ids?: string[];
}

export interface EditMatchFormData {
  date: string;
  time: string;
  home_team_id: string;
  away_team_id: string;
  venue: string;
  home_score: number;
  away_score: number;
  home_score_halftime: number;
  away_score_halftime: number;
  status: MatchStatus;
  matchweek: string;
  match_number: string;
  category_id: string;
  video_ids?: string[];
}

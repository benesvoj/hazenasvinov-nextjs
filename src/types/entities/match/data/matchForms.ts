import {MatchPhase, MatchStatus} from '@/enums';

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
  match_phase: MatchPhase;
  video_ids?: string[];
  referee_id_1?: string | null;
  referee_id_2?: string | null;
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
  matchweek: number;
  match_number: number;
  match_phase: MatchPhase;
  category_id: string;
  video_ids?: string[];
  referee_id_1?: string | null;
  referee_id_2?: string | null;
}

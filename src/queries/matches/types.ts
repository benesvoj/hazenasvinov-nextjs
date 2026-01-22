import {MatchStatus} from '@/enums';

/**
 * Data required to insert a new match
 */
export interface MatchInsertData {
  category_id: string;
  season_id: string;
  date: string;
  time: string;
  home_team_id: string;
  away_team_id: string;
  venue: string;
  competition: string;
  is_home: boolean;
  status: MatchStatus;
  matchweek: number | null;
  match_number: number | null;
  video_ids?: string[];
}

/**
 * Data for updating an existing match
 */
export interface MatchUpdateData {
  date?: string;
  time?: string;
  home_team_id?: string;
  away_team_id?: string;
  venue?: string;
  status?: MatchStatus;
  matchweek?: number | null;
  match_number?: number | null;
  home_score?: number;
  away_score?: number;
  home_score_halftime?: number;
  away_score_halftime?: number;
  video_ids?: string[];
  updated_at?: string;
}

/**
 * Data for updating match result only
 */
export interface MatchResultData {
  home_score: number;
  away_score: number;
  home_score_halftime: number;
  away_score_halftime: number;
}

/**
 * Data for bulk matchweek update
 */
export interface BulkMatchweekUpdateData {
  categoryId: string;
  matchweek: string;
  action: 'set' | 'remove';
}

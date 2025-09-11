import {Category} from './category';
import {Season} from './season';
import {Team} from './team';
import {matchStatusesKeys} from '@/constants';

export type MatchStatus = 'upcoming' | 'completed';
export interface Match {
  id: string;
  category_id: string;
  season_id: string;
  date: string;
  time: string;
  home_team_id: string;
  away_team_id: string;
  home_team: Team;
  away_team: Team;
  venue: string;
  competition: string;
  is_home: boolean;
  status: MatchStatus;
  home_score?: number;
  away_score?: number;
  home_score_halftime?: number;
  away_score_halftime?: number;
  matchweek?: number;
  match_number?: number;
  category: Category;
  season: Season;
  /** Optional reference to related blog post */
  post_id?: string;
  /** Additional properties for transformed data */
  home_team_is_own_club?: boolean;
  away_team_is_own_club?: boolean;
  home_team_logo?: string;
  away_team_logo?: string;
}

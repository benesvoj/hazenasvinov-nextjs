import {Nullish} from '../../../shared/Nullish';
import {Category} from '../../category/data/category';
import {Season} from '../../season/data/season';
import {Team} from '../../team/data/team';

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
  home_score?: number | Nullish;
  away_score?: number | Nullish;
  home_score_halftime?: number | Nullish;
  away_score_halftime?: number | Nullish;
  matchweek?: number | Nullish;
  match_number?: number | Nullish;
  category: Category;
  season: Season;
  /** Optional reference to related blog post */
  post_id?: string;
  /** Array of related video IDs */
  video_ids?: string[];
  /** Additional properties for transformed data */
  home_team_is_own_club?: boolean;
  away_team_is_own_club?: boolean;
  home_team_logo?: string;
  away_team_logo?: string;
}

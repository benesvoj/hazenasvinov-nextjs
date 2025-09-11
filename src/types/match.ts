import {Category} from './category';
import {Season} from './season';
import {Team} from './team';

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
  status: 'upcoming' | 'completed';
  home_score?: number;
  away_score?: number;
  home_team_halftime_score?: number;
  away_team_halftime_score?: number;
  result?: 'win' | 'loss' | 'draw';
  matchweek?: number;
  match_number?: number;
  category: Category;
  season: Season;
  post_id?: string; // Optional reference to related blog post
  // Additional properties for transformed data
  home_team_is_own_club?: boolean;
  away_team_is_own_club?: boolean;
  home_team_logo?: string;
  away_team_logo?: string;
}

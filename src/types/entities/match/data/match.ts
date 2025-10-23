import {Nullish, Category, Season, Team} from '@/types';

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

export interface TeamBettingData {
  club_category: {
    club: {
      id: string;
      is_own_club?: boolean;
      logo_url?: string;
      name: string;
      short_name?: string;
    };
    id: string;
    team_suffix: string;
  };
}

export interface MatchBettingData {
  away_team: TeamBettingData;
  away_team_id: string;
  category: {
    age_group: string;
    description: string;
    id: string;
    name: string;
  };
  category_id: string;
  competition: string;
  date: string;
  home_team: TeamBettingData;
  home_team_id: string;
  id: string;
  time: string;
  season: {
    id: string;
    name: string;
  };
  season_id: string;
  status: MatchStatus;
  venue: string;
}

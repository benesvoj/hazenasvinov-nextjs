import {CompetitionTypes} from '@/enums';

import {Season} from '../../season/data/season';

export interface CategorySeason {
  id: string;
  category_id: string;
  season_id: string;
  matchweek_count: number;
  competition_type: CompetitionTypes;
  team_count: number;
  allow_team_duplicates: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  season?: Season;
}

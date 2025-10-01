import {Club, Category, Season} from '@/types';

export interface ClubCategory {
  id: string;
  club_id: string;
  category_id: string;
  season_id: string;
  max_teams: number;
  is_active: boolean;
  club: Club | null;
  category: Category | null;
  season: Season | null;
}

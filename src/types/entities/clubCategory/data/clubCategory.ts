import {Club, Category, Season, ClubCategorySchema} from '@/types';

/**
 * @deprecated do not use it any more. Doesn't fit to schema
 */
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

/**
 * Club Category with joined relations
 * Use this type for display/list views
 */
export interface ClubCategoryWithRelations extends ClubCategorySchema {
  club: Pick<Club, 'id' | 'name' | 'logo_url'> | null;
  category: Pick<Category, 'id' | 'name'> | null;
  season: Pick<Season, 'id' | 'name'> | null;
}

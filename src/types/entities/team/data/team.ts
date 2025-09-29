export interface Team {
  id: string;
  name: string;
  team_suffix: string;
  category_name?: string;
  category_sort_order?: number;
  season_name?: string;
  is_active?: boolean;
  club_category_id?: string;
  logo_url?: string;
  short_name?: string;
  display_name?: string;
  is_own_club?: boolean;
}

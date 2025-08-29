export interface Club {
  id: string;
  name: string;
  short_name?: string;
  logo_url?: string;
  city?: string;
  founded_year?: number;
  venue?: string;
  web?: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
  contact_person?: string;
  is_own_club?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClubTeam {
  id: string;
  club_id: string;
  team_id: string;
  team_suffix: string;
  is_primary: boolean;
  created_at: string;
}

export interface ClubCategory {
  id: string;
  club_id: string;
  category_id: string;
  season_id: string;
  is_active: boolean;
  created_at: string;
}

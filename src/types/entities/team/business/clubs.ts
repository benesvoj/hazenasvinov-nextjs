export interface Club {
  id: string;
  name: string;
  short_name?: string;
  logo_url?: string;
  city?: string;
  founded_year?: number | null;
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

// Table club_category_teams
export interface ClubTeam {
  id: string;
  club_id: string;
  team_id: string;
  team_suffix: string;
  category_id: string;
  is_primary?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ClubCategoryWithClub {
  id: string;
  max_teams: number;
  club: Club;
}

export interface ClubWithTeams {
  id: string;
  name: string;
  short_name?: string;
  logo_url?: string;
  teams: ClubCategoryTeams[];
}

export interface ClubCategoryTeams {
  id: string;
  club_category_id: string;
  team_suffix: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

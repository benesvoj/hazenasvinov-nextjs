export interface Team {
  id: string;
  name: string;
  short_name?: string;
  logo_url?: string;
  club_id?: string;
  club_name?: string;
  team_suffix?: string;
  display_name?: string;
  venue?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FilteredTeam {
    id: string;
    name: string;
    club_id: string;
    club_name: string;
    team_suffix: string;
    display_name: string;
    is_active: boolean;
    venue?: string;
  }
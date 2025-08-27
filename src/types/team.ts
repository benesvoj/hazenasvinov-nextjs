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
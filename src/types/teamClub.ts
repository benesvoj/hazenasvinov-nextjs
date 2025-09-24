export interface TeamClub {
  team_id: string;
  club_id: string;
  club_name: string;
  club_short_name?: string;
  team_suffix: string;
  is_primary?: boolean;
}

export interface UseTeamClubOptions {
  teamId?: string;
  clubId?: string;
  categoryId?: string;
  seasonId?: string;
}

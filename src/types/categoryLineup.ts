// Category-based lineup types for team management
// This is different from match lineups - these represent the actual team composition for each category

export interface CategoryLineup {
  id: string;
  name: string;
  category_id: string;
  season_id: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CategoryLineupMember {
  id: string;
  lineup_id: string;
  member_id: string;
  position: 'goalkeeper' | 'field_player';
  jersey_number?: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  is_active: boolean;
  added_at: string;
  added_by: string;
  member?: {
    id: string;
    name: string;
    surname: string;
    registration_number: string;
    category: string;
  };
}

export interface CategoryLineupFormData {
  name: string;
  description?: string;
  category_id: string;
  season_id: string;
}

export interface AddMemberToLineupData {
  member_id: string;
  position: 'goalkeeper' | 'field_player';
  jersey_number?: number;
  is_captain?: boolean;
  is_vice_captain?: boolean;
}

export interface CategoryLineupFilters {
  category_id?: string;
  season_id?: string;
  is_active?: boolean;
}

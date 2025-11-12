// Category-based lineup types for team management
// This is different from match lineups - these represent the actual team composition for each category

import {CategoryLineupInsert, CategoryLineupSchema, CategoryLineupUpdate, Committee} from "@/types";

export interface CategoryLineup extends CategoryLineupSchema{}

export interface CreateCategoryLineup extends CategoryLineupInsert{}

export interface UpdateCategoryLineup extends CategoryLineupUpdate{}

export type CategoryLineupFormData = Omit<CategoryLineup, 'id' | 'created_at' | 'updated_at'>;

// Raw database record structure from Supabase query
export interface RawCategoryLineupMember {
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
  members: {
    id: string;
    name: string;
    surname: string;
    registration_number: string;
    category_id: string;
  };
}

export interface CategoryLineupMemberOld {
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
    category_id: string;
  };
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

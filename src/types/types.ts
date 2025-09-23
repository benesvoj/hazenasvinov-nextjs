import {Category} from './category';
import {LineupCoachRoles} from '@/constants';

type CategoryProps = {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  route?: string;
};

type SeasonProps = {
  id: string;
  name: string;
  valid_from: string;
  valid_to: string;
  created_at: string;
  updated_at: string;
};

type SupabaseUser = {
  id: string;
  email: string;
  updated_at: string;
  created_at: string;
  user_metadata?: {
    full_name?: string;
    phone?: string;
    bio?: string;
    position?: string;
    is_blocked?: boolean;
  };
  email_confirmed_at?: string;
};

type ColumnType = {
  key: string;
  label: React.ReactNode;
  // Add other properties if they exist
};

export interface ClubConfig {
  id: string;
  club_name: string;
  club_logo_path?: string;
  club_logo_url?: string;
  hero_image_path?: string;
  hero_image_url?: string;
  hero_title: string;
  hero_subtitle?: string;
  hero_button_text?: string;
  hero_button_link?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  facebook_url?: string;
  instagram_url?: string;
  website_url?: string;
  founded_year?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageVisibility {
  id: string;
  page_key: string;
  page_title: string;
  page_route: string;
  page_description?: string;
  is_visible: boolean;
  sort_order: number;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type {CategoryProps, SeasonProps, SupabaseUser, ColumnType};

// Lineup Management Types
export interface Lineup {
  id: string;
  match_id: string;
  team_id: string;
  is_home_team: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExternalPlayer {
  id: string;
  registration_number: string;
  name: string;
  surname: string;
  position: string;
  created_at: string;
  updated_at: string;
}

export interface LineupPlayer {
  id?: string;
  lineup_id?: string;
  member_id?: string;
  external_name?: string;
  external_surname?: string;
  external_registration_number?: string;
  display_name?: string;
  is_external?: boolean;
  position: string;
  role?: string;
}

export interface LineupCoach {
  id: string;
  lineup_id: string;
  member_id: string;
  role: LineupCoachRoles;
  created_at: string;
  updated_at: string;
  // Extended fields for display
  member?: import('@/types/member').Member;
  member_name?: string;
  member_surname?: string;
}

export interface LineupSummary {
  total_players: number;
  goalkeepers: number;
  field_players: number;
  coaches: number;
  is_valid: boolean;
}

export interface LineupFormData {
  match_id: string;
  team_id: string;
  is_home_team: boolean;
  players: LineupPlayerFormData[];
  coaches: LineupCoachFormData[];
}

export interface LineupPlayerFormData {
  member_id?: string;
  external_name?: string;
  external_surname?: string;
  external_registration_number?: string;
  display_name?: string;
  is_external?: boolean;
  position: string;
  role?: string;
  is_captain?: boolean;
  jersey_number?: number;
  goals?: number;
  yellow_cards?: number;
  red_cards_5min?: number;
  red_cards_10min?: number;
  red_cards_personal?: number;
}

export interface LineupCoachFormData {
  member_id: string;
  role: LineupCoachRoles;
}

export interface LineupValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MemberFunction {
  id: string; // Can be either UUID or simple text ID like 'func_player'
  name: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MembersListTabProps {
  members: import('@/types/member').Member[];
  categoriesData: Category[] | null;
  functionOptions: Record<string, string>;
  sexOptions: Record<string, string>;
}

export interface MembersStatisticTabProps {
  members: import('@/types/member').Member[];
  categoriesData: Category[] | null;
  functionOptions: Record<string, string>;
}

type CategoryProps = {
	id: string;
	name: string;
	description?: string;
	created_at?: string;
	updated_at?: string;
	route?: string;
}

type SeasonProps = {
	id: string;
	name: string;
	valid_from: string;
	valid_to: string;
	created_at: string;
	updated_at: string;
}

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
}


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


export type { CategoryProps, SeasonProps, SupabaseUser, ColumnType }

// Member interface for lineup management
export interface Member {
  id: string;
  registration_number: string;
  name: string;
  surname: string;
  date_of_birth: string;
  category: string;
  sex: 'male' | 'female';
  functions: string[];
  created_at: string;
  updated_at: string;
}

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
  external_player_id?: string;
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
  role: 'head_coach' | 'assistant_coach' | 'goalkeeper_coach';
  created_at: string;
  updated_at: string;
  // Extended fields for display
  member?: Member;
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
  external_player_id?: string;
  external_name?: string;
  external_surname?: string;
  external_registration_number?: string;
  display_name?: string;
  is_external?: boolean;
  position: string;
  role?: string;
}

export interface LineupCoachFormData {
  member_id: string;
  role: 'head_coach' | 'assistant_coach' | 'goalkeeper_coach';
}

export interface LineupValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface Match {
  id: string;
  category_id: string;
  season_id: string;
  date: string;
  time: string;
  home_team_id: string;
  away_team_id: string;
  home_team: { name: string; logo_url?: string; is_own_club?: boolean };
  away_team: { name: string; logo_url?: string; is_own_club?: boolean };
  venue: string;
  competition: string;
  is_home: boolean;
  status: 'upcoming' | 'completed';
  home_score?: number;
  away_score?: number;
  result?: 'win' | 'loss' | 'draw';
  matchweek?: number;
  match_number?: number;
  category: { code: string; name: string; description?: string };
  season: { name: string };
}

export interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
  age_group?: string;
  gender?: string;
  season_id?: string;
  matchweek_count?: number;
  competition_type?: 'league' | 'league_playoff' | 'tournament';
  team_count?: number;
  allow_team_duplicates?: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface Team {
  id: string;
  name: string;
  short_name?: string;
  city?: string;
  region?: string;
  logo_url?: string;
  website?: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  founded_year?: number;
  home_venue?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamCategory {
  id: string;
  team_id: string;
  season_id: string;
  category_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  team?: Team;
}

export interface Standing {
  position: number;
  team: { name: string; logo_url?: string };
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
  category_id?: string;
  season_id?: string;
  team_id?: string;
}
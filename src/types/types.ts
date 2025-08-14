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
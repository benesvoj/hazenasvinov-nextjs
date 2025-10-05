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

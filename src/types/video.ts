export interface Video {
  id: string;
  title: string;
  description?: string;
  youtube_url: string;
  youtube_id: string;
  category_id: string;
  category?: {
    id: string;
    name: string;
    code: string;
  };
  club_id?: string;
  club?: {
    id: string;
    name: string;
    short_name: string;
  };
  recording_date?: string;
  season_id?: string;
  season?: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  };
  thumbnail_url?: string;
  duration?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface VideoFormData {
  title: string;
  description?: string;
  youtube_url: string;
  category_id: string;
  club_id?: string;
  recording_date?: string;
  season_id?: string;
  is_active: boolean;
}

export interface VideoFilters {
  category_id?: string;
  club_id?: string;
  season_id?: string;
  is_active?: boolean;
  search?: string;
}

export interface PhotoAlbum {
  id: string;
  title: string;
  description?: string;
  cover_photo_url?: string;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  photo_count?: number;
}

export interface Photo {
  id: string;
  album_id: string;
  title?: string;
  description?: string;
  file_path: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  uploaded_by?: string;
}

export interface CreateAlbumData {
  title: string;
  description?: string;
  is_public: boolean;
  sort_order?: number;
}

export interface UpdateAlbumData {
  title?: string;
  description?: string;
  cover_photo_url?: string;
  is_public?: boolean;
  sort_order?: number;
}

export interface CreatePhotoData {
  album_id: string;
  title?: string;
  description?: string;
  file_path: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  sort_order?: number;
  is_featured?: boolean;
}

export interface UpdatePhotoData {
  title?: string;
  description?: string;
  sort_order?: number;
  is_featured?: boolean;
}

export interface PhotoUploadResult {
  success: boolean;
  photo?: Photo;
  error?: string;
}

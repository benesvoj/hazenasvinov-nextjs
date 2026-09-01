/**
 * Read shape of `photo_albums`. Nullability mirrors the database: these columns
 * are nullable there, so they arrive as `null`, not `undefined`.
 */
export interface PhotoAlbum {
  id: string;
  title: string;
  description: string | null;
  cover_photo_url: string | null;
  is_public: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  /** Computed from a joined count, not a column. */
  photo_count?: number;
}

/** Read shape of `photos`. Nullability mirrors the database. */
export interface Photo {
  id: string;
  album_id: string;
  title: string | null;
  description: string | null;
  file_path: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  sort_order: number | null;
  is_featured: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  uploaded_by: string | null;
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

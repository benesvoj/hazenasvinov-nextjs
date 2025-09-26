export type MetadataType = 'photo' | 'note' | 'video' | 'document' | 'lineup';

export interface MatchMetadata {
  id: string;
  match_id: string;
  metadata_type: MetadataType;
  content?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  is_primary: boolean;
}

export interface CreateMatchMetadataRequest {
  match_id: string;
  metadata_type: MetadataType;
  content?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  metadata?: Record<string, any>;
  is_primary?: boolean;
}

export interface UpdateMatchMetadataRequest {
  id: string;
  content?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  metadata?: Record<string, any>;
  is_primary?: boolean;
}

// Specific metadata type interfaces
export interface PhotoMetadata extends MatchMetadata {
  metadata_type: 'photo';
  file_url: string;
  file_name: string;
  mime_type: string;
  metadata?: {
    width?: number;
    height?: number;
    taken_at?: string;
    caption?: string;
  };
}

export interface NoteMetadata extends MatchMetadata {
  metadata_type: 'note';
  content: string;
  metadata?: {
    note_type?: 'general' | 'tactical' | 'post_match' | 'pre_match';
    is_public?: boolean;
  };
}

export interface VideoMetadata extends MatchMetadata {
  metadata_type: 'video';
  file_url: string;
  file_name: string;
  mime_type: string;
  metadata?: {
    duration?: number;
    thumbnail_url?: string;
    description?: string;
  };
}

export interface DocumentMetadata extends MatchMetadata {
  metadata_type: 'document';
  file_url: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  metadata?: {
    document_type?: 'report' | 'statistics' | 'analysis';
    pages?: number;
  };
}

export interface LineupMetadata extends MatchMetadata {
  metadata_type: 'lineup';
  file_url?: string;
  file_name?: string;
  mime_type?: string;
  metadata?: {
    formation?: string;
    players?: Array<{
      id: string;
      name: string;
      position: string;
      jersey_number: number;
    }>;
    substitutions?: Array<{
      player_in: string;
      player_out: string;
      minute: number;
    }>;
  };
}

// Union type for all metadata
export type AnyMatchMetadata =
  | PhotoMetadata
  | NoteMetadata
  | VideoMetadata
  | DocumentMetadata
  | LineupMetadata;

// Helper type guards
export function isPhotoMetadata(metadata: MatchMetadata): metadata is PhotoMetadata {
  return metadata.metadata_type === 'photo';
}

export function isNoteMetadata(metadata: MatchMetadata): metadata is NoteMetadata {
  return metadata.metadata_type === 'note';
}

export function isVideoMetadata(metadata: MatchMetadata): metadata is VideoMetadata {
  return metadata.metadata_type === 'video';
}

export function isDocumentMetadata(metadata: MatchMetadata): metadata is DocumentMetadata {
  return metadata.metadata_type === 'document';
}

export function isLineupMetadata(metadata: MatchMetadata): metadata is LineupMetadata {
  return metadata.metadata_type === 'lineup';
}

import type {RecordingSchema} from './recording.schema';

export interface Recording extends RecordingSchema {
  category?: {
    id: string;
    name: string;
    code: string;
  };
  clubs?: {
    id: string;
    name: string;
    short_name: string;
  };
  seasons?: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  };
  match_ids?: string[];
}

export interface RecordingFormData {
  title: string;
  description: string | null;
  youtube_url: string;
  category_id: string;
  club_id: string | null;
  recording_date: string | null;
  season_id: string | null;
  is_active: boolean;
}

export interface RecordingFilters {
  category_id?: string;
  club_id?: string;
  season_id?: string;
  is_active?: boolean;
  search?: string;
}

/**
 * Video with associated match information
 * Used when displaying videos in match preparation contexts
 */
export interface RecordingWithMatch extends RecordingSchema {
  match?: {
    id: string;
    date: string;
    status: 'upcoming' | 'completed';
    home_team: {
      id: string;
      name: string;
      short_name: string;
    };
    away_team: {
      id: string;
      name: string;
      short_name: string;
    };
    home_score?: number | null;
    away_score?: number | null;
    home_score_halftime?: number | null;
    away_score_halftime?: number | null;
  };
}

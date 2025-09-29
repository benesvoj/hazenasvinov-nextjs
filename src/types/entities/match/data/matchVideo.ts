export interface MatchVideo {
  id: string;
  match_id: string;
  video_id: string;
  created_at: string;
  updated_at: string;
}

export interface MatchVideoWithDetails extends MatchVideo {
  match?: {
    id: string;
    date: string;
    home_team: {
      name: string;
    };
    away_team: {
      name: string;
    };
  };
  video?: {
    id: string;
    title: string;
    thumbnail_url?: string;
    youtube_url: string;
  };
}

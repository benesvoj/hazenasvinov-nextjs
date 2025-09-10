export interface Match {
    id: string;
    category_id: string;
    season_id: string;
    date: string;
    time: string;
    home_team_id: string;
    away_team_id: string;
    home_team: { 
      id: string;
      name: string; 
      logo_url?: string; 
      is_own_club?: boolean; 
      short_name?: string;
      club_id?: string;
      club_name?: string;
      team_suffix?: string;
      display_name?: string;
    };
    away_team: { 
      id: string;
      name: string; 
      logo_url?: string; 
      is_own_club?: boolean; 
      short_name?: string;
      club_id?: string;
      club_name?: string;
      team_suffix?: string;
      display_name?: string;
    };
    venue: string;
    competition: string;
    is_home: boolean;
    status: 'upcoming' | 'completed';
    home_score?: number;
    away_score?: number;
    result?: 'win' | 'loss' | 'draw';
    matchweek?: number;
    match_number?: number;
    category: { id: string; name: string; description?: string };
    season: { name: string };
    post_id?: string; // Optional reference to related blog post
    // Additional properties for transformed data
    home_team_is_own_club?: boolean;
    away_team_is_own_club?: boolean;
    home_team_logo?: string;
    away_team_logo?: string;
    category_code?: string;
  }
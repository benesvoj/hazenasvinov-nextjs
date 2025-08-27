export interface Match {
    id: string;
    date: string;
    time: string;
    home_team: string;
    away_team: string;
    home_team_logo?: string;
    away_team_logo?: string;
    home_team_is_own_club?: boolean;
    away_team_is_own_club?: boolean;
    home_team_short_name?: string;
    away_team_short_name?: string;
    venue: string;
    competition: string;
    is_home: boolean;
    status: 'upcoming' | 'completed';
    home_score?: number;
    away_score?: number;
    result?: 'win' | 'loss' | 'draw';
    category?: { name: string; description?: string };
    matchweek?: number;
}
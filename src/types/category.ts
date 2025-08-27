export interface Category {
    id: string;
    code: string;
    name: string;
    description?: string;
    age_group?: string;
    gender?: string;
    season_id?: string;
    matchweek_count?: number;
    competition_type?: 'league' | 'league_playoff' | 'tournament';
    team_count?: number;
    allow_team_duplicates?: boolean;
    is_active: boolean;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
}
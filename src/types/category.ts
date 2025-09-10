import { GenderType } from "@/constants";
/**
 * @deprecated This interface is deprecated and will be replaced by the new CategoryNew interface
 * Category interface representing the database schema for categories table.
 * 
 * This interface defines the structure for sports categories (e.g., men, women, juniors)
 * used throughout the application for organizing teams, matches, and competitions.
 * 
 * @property id - Unique UUID identifier (primary key)
 * @property code - Legacy string code for backward compatibility (e.g., 'men', 'women')
 * @property name - Display name in Czech (e.g., 'Muži', 'Ženy')
 * @property description - Optional detailed description
 * @property age_group - Age classification ('adults', 'juniors', 'youth', 'kids')
 * @property gender - Gender classification ('male', 'female', 'mixed')
 * @property season_id - Associated season UUID (optional)
 * @property matchweek_count - Number of matchweeks in competition
 * @property competition_type - Type of competition ('league', 'league_playoff', 'tournament')
 * @property team_count - Expected number of teams
 * @property allow_team_duplicates - Whether A/B teams from same club are allowed
 * @property is_active - Whether category is currently active
 * @property sort_order - Display order in UI
 * @property created_at - Creation timestamp
 * @property updated_at - Last update timestamp
 */
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

/**
 * Enhanced Category interface for the new category system with URL-friendly routing.
 * 
 * This interface extends the base Category with a slug field for better URL handling
 * and removes some optional fields to simplify the core category structure.
 * 
 * @property id - Unique UUID identifier (primary key)
 * @property code - Legacy string code for backward compatibility (e.g., 'men', 'women')
 * @property name - Display name in Czech (e.g., 'Muži', 'Ženy')
 * @property description - Optional detailed description
 * @property age_group - Age classification ('adults', 'juniors', 'youth', 'kids')
 * @property gender - Gender classification ('male', 'female', 'mixed')
 * @property is_active - Whether category is currently active
 * @property sort_order - Display order in UI
 * @property created_at - Creation timestamp
 * @property updated_at - Last update timestamp
 * @property slug - URL-friendly identifier for routing (e.g., 'men', 'women', 'junior-boys')
 */
export interface CategoryNew {
    id: string;
    code?: string;
    name: string;
    description?: string;
    age_group?: string;
    gender?: GenderType;
    is_active: boolean;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
    slug: string;
}
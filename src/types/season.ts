/**
 * Season interface representing the database schema for seasons table.
 * 
 * This interface defines the structure for seasons used throughout the application
 * for organizing categories, matches, and competitions.
 */
export interface Season {
    /**
     * Unique UUID identifier (primary key)
     */
    id: string;
    /**
     * Name of the season
     */
    name: string;
    /**
     * Start date of the season
     */
    start_date?: string;
    /**
     * End date of the season
     */
    end_date?: string;
    /**
     * Whether the season is active
     */
    is_active?: boolean;
    /**
     * Whether the season is closed
     */
    is_closed?: boolean;
    /**
     * Creation timestamp
     */
    created_at?: string;
    /**
     * Last update timestamp
     */
    updated_at?: string;
  }
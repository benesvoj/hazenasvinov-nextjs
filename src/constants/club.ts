/**
 * Club configuration constants
 *
 * This file contains the default club information that can be overridden
 * by environment variables or user context.
 */

export interface ClubConfig {
  name: string;
  shortName: string;
  id?: string;
}

/**
 * Default club configuration
 * Can be overridden by environment variables or user context
 */
export const DEFAULT_CLUB_CONFIG: ClubConfig = {
  name: 'TJ Sokol Svinov',
  shortName: 'Svinov',
};

/**
 * Get the current club configuration
 *
 * This function can be extended to:
 * - Read from environment variables
 * - Get from user context
 * - Fetch from database
 * - Use different clubs based on user role
 *
 * @returns Club configuration object
 */
export function getClubConfig(): ClubConfig {
  // TODO: Implement dynamic club configuration based on:
  // - Environment variables (NEXT_PUBLIC_CLUB_NAME, NEXT_PUBLIC_CLUB_SHORT_NAME)
  // - User context (userProfile?.clubs)
  // - Database query (if multiple clubs are supported)

  return DEFAULT_CLUB_CONFIG;
}

/**
 * Get the club name for display purposes
 *
 * @returns The club name string
 */
export function getClubName(): string {
  return getClubConfig().name;
}

/**
 * Get the club short name for display purposes
 *
 * @returns The club short name string
 */
export function getClubShortName(): string {
  return getClubConfig().shortName;
}

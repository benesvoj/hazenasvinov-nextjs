/**
 * Utility functions for consistent team display logic across the application
 */

export interface TeamDisplayInfo {
  displayName: string;
  shouldShowSuffix: boolean;
  teamCount: number;
}

/**
 * Determines whether to show a team suffix based on how many teams a club has in a category
 * @param teamCount - Number of teams the club has in the current category
 * @returns Object with display logic information
 */
export function getTeamSuffixLogic(teamCount: number): TeamDisplayInfo {
  const shouldShowSuffix = teamCount > 1;
  
  return {
    displayName: shouldShowSuffix ? 'suffix' : 'no-suffix',
    shouldShowSuffix,
    teamCount
  };
}

/**
 * Creates a team display name with smart suffix logic
 * @param clubName - Name of the club
 * @param teamSuffix - Team suffix (e.g., "A", "B", "C")
 * @param teamCount - Number of teams the club has in the current category
 * @returns Formatted team display name
 */
export function getTeamDisplayName(clubName: string, teamSuffix: string, teamCount: number): string {
  const { shouldShowSuffix } = getTeamSuffixLogic(teamCount);
  
  if (shouldShowSuffix && teamSuffix) {
    return `${clubName} ${teamSuffix}`;
  }
  
  return clubName;
}

/**
 * Creates a team display name with smart suffix logic (with fallbacks)
 * @param clubName - Name of the club (can be undefined)
 * @param teamSuffix - Team suffix (can be undefined)
 * @param teamCount - Number of teams the club has in the current category
 * @param fallbackName - Fallback name if club name is missing
 * @returns Formatted team display name
 */
export function getTeamDisplayNameSafe(
  clubName?: string, 
  teamSuffix?: string, 
  teamCount: number = 1, 
  fallbackName: string = "Neznámý tým"
): string {
  if (!clubName) {
    return fallbackName;
  }
  
  return getTeamDisplayName(clubName, teamSuffix || 'A', teamCount);
}

/**
 * Calculates team count for a club within a specific category
 * This is a helper function that can be used when you need to determine team count
 * @param teams - Array of teams in the category
 * @param clubId - ID of the club to count teams for
 * @returns Number of teams the club has in the category
 */
export function calculateClubTeamCount(teams: Array<{ club_id: string }>, clubId: string): number {
  return teams.filter(team => team.club_id === clubId).length;
}

/**
 * Creates a map of club IDs to team counts for standings data
 * This is useful for determining whether to show team suffixes
 * @param standings - Array of standings with club information
 * @returns Map where key is club ID and value is number of teams
 */
export function createClubTeamCountsMap(standings: Array<{ club?: { id: string } | null }>): Map<string, number> {
  const clubTeamCounts = new Map<string, number>();
  
  standings.forEach((standing) => {
    const clubId = standing.club?.id;
    if (clubId) {
      clubTeamCounts.set(clubId, (clubTeamCounts.get(clubId) || 0) + 1);
    }
  });
  
  return clubTeamCounts;
}

/**
 * Generic function to create club team counts map from any data structure
 * @param data - Array of items with club information
 * @param clubIdExtractor - Function to extract club ID from each item
 * @returns Map where key is club ID and value is number of teams
 */
export function createGenericClubTeamCountsMap<T>(
  data: T[], 
  clubIdExtractor: (item: T) => string | undefined | null
): Map<string, number> {
  const clubTeamCounts = new Map<string, number>();
  
  data.forEach((item) => {
    const clubId = clubIdExtractor(item);
    if (clubId) {
      clubTeamCounts.set(clubId, (clubTeamCounts.get(clubId) || 0) + 1);
    }
  });
  
  return clubTeamCounts;
}

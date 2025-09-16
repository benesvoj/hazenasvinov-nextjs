/**
 * Utility functions for consistent team display logic across the application
 */

import {Match} from '@/types';

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
    teamCount,
  };
}

/**
 * Creates a team display name with smart suffix logic
 * @param clubName - Name of the club
 * @param teamSuffix - Team suffix (e.g., "A", "B", "C")
 * @param teamCount - Number of teams the club has in the current category
 * @returns Formatted team display name
 */
export function getTeamDisplayName(
  clubName: string,
  teamSuffix: string,
  teamCount: number
): string {
  const {shouldShowSuffix} = getTeamSuffixLogic(teamCount);

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
  fallbackName: string = 'Neznámý tým'
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
export function calculateClubTeamCount(teams: Array<{club_id: string}>, clubId: string): number {
  return teams.filter((team) => team.club_id === clubId).length;
}

/**
 * Creates a map of club IDs to team counts for standings data
 * This is useful for determining whether to show team suffixes
 * @param standings - Array of standings with club information
 * @returns Map where key is club ID and value is number of teams
 */
export function createClubTeamCountsMap(
  standings: Array<{club?: {id: string} | null}>
): Map<string, number> {
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

/**
 * Transforms match data to include properly formatted team display names
 * This consolidates the team name transformation logic used across multiple hooks
 * @param match - Raw match data from database
 * @param allMatches - All matches in the category (needed for team count calculation)
 * @param options - Configuration options for the transformation
 * @returns Transformed match with formatted team names
 */
export function transformMatchWithTeamNames(
  match: any,
  allMatches: any[] = [],
  options: {
    useTeamMap?: boolean;
    teamMap?: Map<string, any>;
    teamDetails?: any[];
    clubTeamCounts?: Map<string, number>;
  } = {}
): any {
  const {useTeamMap = false, teamMap, teamDetails, clubTeamCounts} = options;

  let homeTeamDetails: any;
  let awayTeamDetails: any;
  let homeClubId: string | undefined;
  let awayClubId: string | undefined;

  if (useTeamMap && teamMap) {
    // For useFetchMatches structure
    homeTeamDetails = teamMap.get(match.home_team_id);
    awayTeamDetails = teamMap.get(match.away_team_id);
    homeClubId = homeTeamDetails?.club_category?.club?.id;
    awayClubId = awayTeamDetails?.club_category?.club?.id;
  } else {
    // For useOwnClubMatches structure
    homeTeamDetails = match.home_team;
    awayTeamDetails = match.away_team;
    homeClubId = match.home_team?.club_category?.club?.id;
    awayClubId = match.away_team?.club_category?.club?.id;
  }

  // Count teams per club in this category
  let finalClubTeamCounts = clubTeamCounts || new Map<string, number>();

  if (!clubTeamCounts) {
    // Only calculate if not provided
    if (teamDetails && teamDetails.length > 0) {
      // Count from team details (most accurate approach)
      teamDetails.forEach((team: any) => {
        const clubId = team.club_category?.club?.id;
        if (clubId) {
          finalClubTeamCounts.set(clubId, (finalClubTeamCounts.get(clubId) || 0) + 1);
        }
      });
    } else if (useTeamMap) {
      // Fallback: Count from team details (useFetchMatches approach)
      teamDetails?.forEach((team: any) => {
        const clubId = team.club_category?.club?.id;
        if (clubId) {
          finalClubTeamCounts.set(clubId, (finalClubTeamCounts.get(clubId) || 0) + 1);
        }
      });
    } else {
      // Fallback: Count from all matches (useOwnClubMatches approach)
      allMatches.forEach((matchData: any) => {
        const homeClubId = matchData.home_team?.club_category?.club?.id;
        if (homeClubId) {
          finalClubTeamCounts.set(homeClubId, (finalClubTeamCounts.get(homeClubId) || 0) + 1);
        }
        const awayClubId = matchData.away_team?.club_category?.club?.id;
        if (awayClubId) {
          finalClubTeamCounts.set(awayClubId, (finalClubTeamCounts.get(awayClubId) || 0) + 1);
        }
      });
    }
  }

  // Use centralized team display utility with smart suffix logic
  const homeTeamCount = finalClubTeamCounts.get(homeClubId || '') || 1;
  const awayTeamCount = finalClubTeamCounts.get(awayClubId || '') || 1;

  const homeTeamName = getTeamDisplayNameSafe(
    homeTeamDetails?.club_category?.club?.name,
    homeTeamDetails?.team_suffix || 'A',
    homeTeamCount,
    'Home team'
  );
  const awayTeamName = getTeamDisplayNameSafe(
    awayTeamDetails?.club_category?.club?.name,
    awayTeamDetails?.team_suffix || 'A',
    awayTeamCount,
    'Away team'
  );

  // Calculate short names with proper suffix logic
  const homeShortName = getTeamDisplayNameSafe(
    homeTeamDetails?.club_category?.club?.short_name,
    homeTeamDetails?.team_suffix || 'A',
    homeTeamCount,
    'Home team'
  );
  const awayShortName = getTeamDisplayNameSafe(
    awayTeamDetails?.club_category?.club?.short_name,
    awayTeamDetails?.team_suffix || 'A',
    awayTeamCount,
    'Away team'
  );

  // Determine if teams are own club
  const homeIsOwnClub = useTeamMap
    ? homeTeamDetails?.club_category?.club?.is_own_club === true
    : match.home_team?.club_category?.club?.is_own_club === true;
  const awayIsOwnClub = useTeamMap
    ? awayTeamDetails?.club_category?.club?.is_own_club === true
    : match.away_team?.club_category?.club?.is_own_club === true;

  if (useTeamMap) {
    // Return structure for useFetchMatches
    return {
      ...match,
      home_team: {
        id: match.home_team_id,
        name: homeTeamName,
        short_name: homeShortName,
        is_own_club: homeIsOwnClub,
        logo_url: homeTeamDetails?.club_category?.club?.logo_url,
      },
      away_team: {
        id: match.away_team_id,
        name: awayTeamName,
        short_name: awayShortName,
        is_own_club: awayIsOwnClub,
        logo_url: awayTeamDetails?.club_category?.club?.logo_url,
      },
      // Add top-level properties for filtering
      home_team_is_own_club: homeIsOwnClub,
      away_team_is_own_club: awayIsOwnClub,
    };
  } else {
    // Return structure for useOwnClubMatches
    return {
      ...match,
      home_team: {
        id: match.home_team?.id,
        name: homeTeamName,
        short_name: homeShortName,
        is_own_club: homeIsOwnClub,
        logo_url: match.home_team?.club_category?.club?.logo_url,
      },
      away_team: {
        id: match.away_team?.id,
        name: awayTeamName,
        short_name: awayShortName,
        is_own_club: awayIsOwnClub,
        logo_url: match.away_team?.club_category?.club?.logo_url,
      },
      // Add top-level properties for filtering
      home_team_is_own_club: homeIsOwnClub,
      away_team_is_own_club: awayIsOwnClub,
    };
  }
}

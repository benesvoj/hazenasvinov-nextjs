import {useMemo} from 'react';

interface Team {
  id: string;
  name: string;
  short_name?: string;
  club_name: string;
  club_short_name?: string;
  team_suffix: string;
  category_id?: string;
  season_id?: string;
}

interface TeamDisplayOptions {
  showClubName?: boolean;
  showSuffix?: boolean;
  preferShortName?: boolean;
  maxLength?: number;
}

export function useTeamDisplayLogic(selectedCategory?: string) {
  // This parameter is for legacy compatibility but not used in the new implementation
  const getTeamDisplayName = (team: Team, options: TeamDisplayOptions = {}): string => {
    const {showClubName = true, showSuffix = true, preferShortName = false, maxLength} = options;

    let displayName = '';

    if (showClubName) {
      const clubName =
        preferShortName && team.club_short_name ? team.club_short_name : team.club_name;
      displayName = clubName;
    }

    if (showSuffix && team.team_suffix) {
      displayName += ` ${team.team_suffix}`;
    }

    if (maxLength && displayName.length > maxLength) {
      displayName = displayName.substring(0, maxLength - 3) + '...';
    }

    return displayName || team.name;
  };

  const getTeamShortName = (team: Team): string => {
    if (team.short_name) return team.short_name;

    const clubName = team.club_short_name || team.club_name;
    return team.team_suffix ? `${clubName} ${team.team_suffix}` : clubName;
  };

  const getTeamFullName = (team: Team): string => {
    return team.team_suffix ? `${team.club_name} ${team.team_suffix}` : team.club_name;
  };

  const sortTeamsByClub = (teams: Team[]): Team[] => {
    return [...teams].sort((a, b) => {
      // Sort by club name first
      const clubComparison = a.club_name.localeCompare(b.club_name);
      if (clubComparison !== 0) return clubComparison;

      // Then by team suffix
      return a.team_suffix.localeCompare(b.team_suffix);
    });
  };

  const groupTeamsByClub = (teams: Team[]): Record<string, Team[]> => {
    return teams.reduce(
      (groups, team) => {
        const clubName = team.club_name;
        if (!groups[clubName]) {
          groups[clubName] = [];
        }
        groups[clubName].push(team);
        return groups;
      },
      {} as Record<string, Team[]>
    );
  };

  const getPrimaryTeam = (teams: Team[]): Team | null => {
    return teams[0] || null;
  };

  const getTeamsByCategory = (teams: Team[], categoryId: string): Team[] => {
    return teams.filter((team) => team.category_id === categoryId);
  };

  const getTeamsBySeason = (teams: Team[], seasonId: string): Team[] => {
    return teams.filter((team) => team.season_id === seasonId);
  };

  return {
    getTeamDisplayName,
    getTeamShortName,
    getTeamFullName,
    sortTeamsByClub,
    groupTeamsByClub,
    getPrimaryTeam,
    getTeamsByCategory,
    getTeamsBySeason,
    // Legacy compatibility
    teamCounts: [],
    loading: false,
    fetchTeamCounts: () => Promise.resolve(),
  };
}

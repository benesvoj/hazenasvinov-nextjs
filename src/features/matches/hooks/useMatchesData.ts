'use client';

import {useCallback, useEffect, useState} from 'react';

import {useMatchesSeasonal} from '@/hooks/shared/queries/useMatchQueries';

import {useFetchMembers, useTeams} from '@/hooks';
import {Match} from '@/types';

interface UseMatchesDataProps {
  selectedCategoryId: string;
  selectedSeasonId: string;
}

export function useMatchesData({selectedCategoryId, selectedSeasonId}: UseMatchesDataProps) {
  const [expandedMatchweeks, setExpandedMatchweeks] = useState<Set<string>>(new Set());

  const {data: members, loading: membersLoading, refetch: fetchMembers} = useFetchMembers();
  const {teams, loading: allTeamsLoading, fetchTeams} = useTeams();

  const {data: seasonalMatchesData, error: matchesError} = useMatchesSeasonal({
    categoryId: selectedCategoryId,
    seasonId: selectedSeasonId,
    ownClubOnly: false,
    includeTeamDetails: true,
    includeCategory: true,
    includeSeason: true,
    leagueOnly: true,
  });

  useEffect(() => {
    fetchTeams();
    fetchMembers();
  }, [fetchTeams, fetchMembers]);

  const seasonalMatches = seasonalMatchesData || {autumn: [], spring: []};
  const matches: Match[] = selectedCategoryId
    ? [...(seasonalMatches.autumn || []), ...(seasonalMatches.spring || [])]
    : [];

  const toggleMatchweek = useCallback((categoryId: string, matchweek: number) => {
    const key = `${categoryId}-${matchweek}`;
    setExpandedMatchweeks((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const isMatchweekExpanded = useCallback(
    (categoryId: string, matchweek: number) => expandedMatchweeks.has(`${categoryId}-${matchweek}`),
    [expandedMatchweeks]
  );

  return {
    members,
    membersLoading,
    teams,
    allTeamsLoading,
    matches,
    seasonalMatches,
    matchesError,
    expandedMatchweeks,
    toggleMatchweek,
    isMatchweekExpanded,
  };
}

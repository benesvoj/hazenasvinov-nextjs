'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';

import {useHeadToHeadMatches, useMatchesWithTeams, useSupabaseClient} from '@/hooks';
import {Match, Nullish} from '@/types';

export function useStrategyPreparation(selectedMatch: Match | Nullish) {
  // Previous matches data
  const {
    data: allMatchesData,
    isLoading: previousMatchesLoading,
    error: previousMatchesError,
  } = useMatchesWithTeams({
    categoryId: selectedMatch?.category_id,
    ownClubOnly: false,
    status: 'completed',
    includeTeamDetails: true,
    includeCategory: true,
  });

  const supabase = useSupabaseClient();

  // Get opponent team info
  const opponentTeam = useMemo(() => {
    if (!selectedMatch) return null;

    const homeIsOwnClub = selectedMatch.home_team_is_own_club;
    const awayIsOwnClub = selectedMatch.away_team_is_own_club;

    if (homeIsOwnClub && !awayIsOwnClub) {
      return selectedMatch.away_team;
    } else if (!homeIsOwnClub && awayIsOwnClub) {
      return selectedMatch.home_team;
    }

    return null;
  }, [selectedMatch]);

  // Filter matches for the opponent team
  const previousMatches = useMemo(() => {
    if (!allMatchesData?.data || !opponentTeam?.id) return [];

    return allMatchesData.data
      .filter(
        (match: any) =>
          match.home_team_id === opponentTeam.id || match.away_team_id === opponentTeam.id
      )
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [allMatchesData, opponentTeam?.id]);

  // Determine which team is from our club
  const ownClubTeamId = useMemo(() => {
    if (!selectedMatch || !opponentTeam?.id) {
      return undefined;
    }

    if (selectedMatch.home_team_id === opponentTeam.id) {
      return selectedMatch.away_team_id;
    } else if (selectedMatch.away_team_id === opponentTeam.id) {
      return selectedMatch.home_team_id;
    }

    return undefined;
  }, [selectedMatch, opponentTeam?.id]);

  // Head-to-head matches
  const {
    data: headToHeadMatches = [],
    isLoading: headToHeadLoading,
    error: headToHeadError,
  } = useHeadToHeadMatches({
    categoryId: selectedMatch?.category_id,
    opponentTeamId: opponentTeam?.id,
    ownClubTeamId: ownClubTeamId,
    limit: 10,
  });

  // Get our club team IDs for statistics calculation
  const ourClubTeamIds = useMemo(() => {
    if (!headToHeadMatches.length) return [];

    const teamIds = new Set<string>();
    headToHeadMatches.forEach((match: any) => {
      if (match.home_team?.club_category?.club?.is_own_club) {
        teamIds.add(match.home_team_id);
      }
      if (match.away_team?.club_category?.club?.is_own_club) {
        teamIds.add(match.away_team_id);
      }
    });
    return Array.from(teamIds);
  }, [headToHeadMatches]);

  // club_id is populated directly from the match join — no async lookup needed
  const opponentClubId = opponentTeam?.club_id ?? null;
  const opponentClubIdMissing = !!opponentTeam && opponentClubId === null;

  // Videos state and fetching
  const [opponentVideos, setOpponentVideos] = useState<any[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState<string | null>(null);

  const fetchOpponentVideos = useCallback(
    async (clubId: string, categoryId: string) => {
      try {
        setVideosLoading(true);
        setVideosError(null);

        const {data: videos, error} = await supabase
          .from('videos')
          .select(
            `
          *,
          categories(id, name),
          clubs(id, name, short_name),
          seasons(id, name),
          match_videos(
            match_id,
            match:matches(
              id,
              home_team_id,
              away_team_id,
              home_score,
              away_score,
              home_score_halftime,
              away_score_halftime,
              status,
              date,
              home_team:club_category_teams!matches_home_team_id_fkey(
                id,
                team_suffix,
                club_category:club_categories(
                  club:clubs(
                    name,
                    short_name
                  )
                )
              ),
              away_team:club_category_teams!matches_away_team_id_fkey(
                id,
                team_suffix,
                club_category:club_categories(
                  club:clubs(
                    name,
                    short_name
                  )
                )
              )
            )
          )
        `
          )
          .eq('is_active', true)
          .eq('club_id', clubId)
          .eq('category_id', categoryId);

        if (error) throw error;

        setOpponentVideos(videos || []);
      } catch (error) {
        console.error('Error fetching opponent videos:', error);
        setVideosError(error instanceof Error ? error.message : 'Failed to fetch videos');
        setOpponentVideos([]);
      } finally {
        setVideosLoading(false);
      }
    },
    [supabase]
  );

  // Process videos to include match and season information
  const processedVideos = useMemo(() => {
    return opponentVideos.map((video) => {
      const matchVideo = video.match_videos?.[0];
      const match = matchVideo?.match;

      return {
        ...video,
        seasons: video.seasons ? {id: video.seasons.id, name: video.seasons.name} : undefined,
        match: match
          ? {
              id: match.id,
              home_team: {
                id: match.home_team.id,
                name: match.home_team.club_category?.club?.name || 'Unknown Team',
                short_name:
                  match.home_team.club_category?.club?.short_name ||
                  match.home_team.team_suffix ||
                  'Unknown',
              },
              away_team: {
                id: match.away_team.id,
                name: match.away_team.club_category?.club?.name || 'Unknown Team',
                short_name:
                  match.away_team.club_category?.club?.short_name ||
                  match.away_team.team_suffix ||
                  'Unknown',
              },
              home_score: match.home_score,
              away_score: match.away_score,
              home_score_halftime: match.home_score_halftime,
              away_score_halftime: match.away_score_halftime,
              status: match.status,
              date: match.date,
            }
          : undefined,
      };
    });
  }, [opponentVideos]);

  const filteredOpponentVideos = useMemo(
    () =>
      [...processedVideos].sort((a, b) => {
        if (!a.recording_date && !b.recording_date) return 0;
        if (!a.recording_date) return 1;
        if (!b.recording_date) return -1;
        return new Date(b.recording_date).getTime() - new Date(a.recording_date).getTime();
      }),
    [processedVideos]
  );

  useEffect(() => {
    if (selectedMatch?.category_id && selectedMatch?.id && opponentClubId) {
      fetchOpponentVideos(opponentClubId, selectedMatch.category_id);
    }
  }, [selectedMatch?.category_id, selectedMatch?.id, opponentClubId, fetchOpponentVideos]);

  const refetchVideos = useCallback(() => {
    if (selectedMatch?.category_id && opponentClubId) {
      fetchOpponentVideos(opponentClubId, selectedMatch.category_id);
    }
  }, [selectedMatch?.category_id, opponentClubId, fetchOpponentVideos]);

  return {
    // Previous matches
    previousMatches,
    previousMatchesLoading,
    previousMatchesError,

    // Head-to-head matches
    headToHeadMatches,
    headToHeadLoading,
    headToHeadError,
    ourClubTeamIds,

    // Videos
    filteredOpponentVideos,
    videosLoading,
    videosError,
    opponentClubIdMissing,
    refetchVideos,

    // Opponent info
    opponentTeam,
  };
}

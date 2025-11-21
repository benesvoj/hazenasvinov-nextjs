'use client';

import {useState, useEffect, useMemo, useCallback} from 'react';

import {createClient} from '@/utils/supabase/client';

import {useHeadToHeadMatches, useMatchesWithTeams} from '@/hooks';
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

  // Opponent club ID for video filtering
  const [opponentClubId, setOpponentClubId] = useState<string | null>(null);
  const [clubIdLoading, setClubIdLoading] = useState(false);

  // Fetch club ID from club_category_id
  useEffect(() => {
    const fetchClubId = async () => {
      if (
        !opponentTeam?.club_category_id ||
        opponentTeam.club_category_id === 'undefined' ||
        opponentTeam.club_category_id === 'null'
      ) {
        setOpponentClubId(null);
        return;
      }

      try {
        setClubIdLoading(true);
        const supabase = createClient();

        const {data: clubCategory, error} = await supabase
          .from('club_categories')
          .select('club_id')
          .eq('id', opponentTeam.club_category_id)
          .single();

        if (error) {
          console.error('Error fetching club ID:', error);
          setOpponentClubId(null);
        } else {
          setOpponentClubId(clubCategory?.club_id || null);
        }
      } catch (error) {
        console.error('Error fetching club ID:', error);
        setOpponentClubId(null);
      } finally {
        setClubIdLoading(false);
      }
    };

    fetchClubId();
  }, [opponentTeam?.club_category_id]);

  // Videos state and fetching
  const [opponentVideos, setOpponentVideos] = useState<any[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState<string | null>(null);

  // Fetch video for opponent club
  const fetchOpponentVideos = useCallback(async (filters: any) => {
    try {
      setVideosLoading(true);
      setVideosError(null);

      const supabase = createClient();

      if (filters.club_id && (filters.club_id === 'undefined' || filters.club_id === 'null')) {
        setOpponentVideos([]);
        return;
      }

      if (
        filters.category_id &&
        (filters.category_id === 'undefined' || filters.category_id === 'null')
      ) {
        setOpponentVideos([]);
        return;
      }

      let query = supabase
        .from('videos')
        .select(
          `
          *,
          categories(id, name),
          clubs(id, name, short_name),
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
        .eq('is_active', true);

      if (filters.club_id) {
        query = query.eq('club_id', filters.club_id);
      }

      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      const {data: videos, error} = await query;

      if (error) {
        throw error;
      }

      setOpponentVideos(videos || []);
    } catch (error) {
      console.error('Error fetching opponent video:', error);
      setVideosError(error instanceof Error ? error.message : 'Failed to fetch video');
      setOpponentVideos([]);
    } finally {
      setVideosLoading(false);
    }
  }, []);

  // Process video to include match information
  const processedVideos = useMemo(() => {
    return opponentVideos.map((video) => {
      const matchVideo = video.match_videos?.[0];
      const match = matchVideo?.match;

      return {
        ...video,
        match: match
          ? {
              id: match.id,
              home_team: {
                id: match.home_team.id,
                name: match.home_team.club_category?.club?.name || 'Unknown Team',
                short_name:
                  match.home_team.team_suffix ||
                  match.home_team.club_category?.club?.short_name ||
                  'Unknown',
              },
              away_team: {
                id: match.away_team.id,
                name: match.away_team.club_category?.club?.name || 'Unknown Team',
                short_name:
                  match.away_team.team_suffix ||
                  match.away_team.club_category?.club?.short_name ||
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

  // Filter video by opponent team name if no club ID is available
  const filteredOpponentVideos = useMemo(() => {
    if (!opponentTeam?.name || opponentClubId) {
      return processedVideos;
    }

    const teamName = opponentTeam.name.toLowerCase();
    const filtered = processedVideos.filter((video) => {
      const title = video.title?.toLowerCase() || '';
      const description = video.description?.toLowerCase() || '';
      const clubName = video.clubs?.name?.toLowerCase() || '';

      return (
        title.includes(teamName) || description.includes(teamName) || clubName.includes(teamName)
      );
    });

    return filtered;
  }, [processedVideos, opponentTeam?.name, opponentClubId]);

  // Fetch video when match is selected and club ID is available
  useEffect(() => {
    if (selectedMatch?.category_id && selectedMatch?.id && !clubIdLoading) {
      if (opponentClubId) {
        fetchOpponentVideos({
          club_id: opponentClubId,
          category_id: selectedMatch.category_id,
          is_active: true,
        });
      } else {
        fetchOpponentVideos({
          category_id: selectedMatch.category_id,
          is_active: true,
        });
      }
    }
  }, [
    selectedMatch?.category_id,
    selectedMatch?.id,
    opponentClubId,
    opponentTeam?.name,
    clubIdLoading,
    fetchOpponentVideos,
  ]);

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

    // Opponent info
    opponentTeam,
  };
}

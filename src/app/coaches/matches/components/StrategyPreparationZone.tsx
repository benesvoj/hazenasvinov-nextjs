'use client';

import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {Card, CardHeader, CardBody, Button, Tabs, Tab} from '@heroui/react';
import {ClipboardDocumentListIcon, XMarkIcon} from '@heroicons/react/24/outline';
import {useMatchesWithTeams} from '@/hooks/queries/useMatchQueries';
import {useHeadToHeadMatches} from '@/hooks/useHeadToHeadMatches';
import {createClient} from '@/utils/supabase/client';
import {Match, Nullish} from '@/types';
import {TabWithHeadToHead, TabWithStrategy, TabWithVideos, TabWithPreviousMatches} from './';

interface StrategyPreparationZoneProps {
  selectedMatch: Match | Nullish;
  onClose: () => void;
}

export default function StrategyPreparationZone({
  selectedMatch,
  onClose,
}: StrategyPreparationZoneProps) {
  const [activeTab, setActiveTab] = useState('strategy');
  // Use the hook to fetch all matches in the category
  const {
    data: allMatchesData,
    isLoading: previousMatchesLoading,
    error: previousMatchesError,
  } = useMatchesWithTeams({
    categoryId: selectedMatch?.category_id,
    ownClubOnly: false, // Get all matches, not just own club
    status: 'completed', // Only completed matches
    includeTeamDetails: true,
    includeCategory: true,
  });

  // Get opponent team info
  const opponentTeam = useMemo(() => {
    if (!selectedMatch) return null;

    // Determine which team is the opponent (not our club)
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
      .slice(0, 10); // Limit to 10 most recent
  }, [allMatchesData, opponentTeam?.id]);

  // Determine which team is from our club
  const ownClubTeamId = useMemo(() => {
    if (!selectedMatch || !opponentTeam?.id) {
      return undefined;
    }

    // Since we know the opponent team ID, the other team must be from our club
    if (selectedMatch.home_team_id === opponentTeam.id) {
      return selectedMatch.away_team_id;
    } else if (selectedMatch.away_team_id === opponentTeam.id) {
      return selectedMatch.home_team_id;
    }

    return undefined;
  }, [selectedMatch, opponentTeam?.id]);

  const {
    data: headToHeadMatches = [],
    isLoading: headToHeadLoading,
    error: headToHeadError,
  } = useHeadToHeadMatches({
    categoryId: selectedMatch?.category_id,
    opponentTeamId: opponentTeam?.id,
    ownClubTeamId: ownClubTeamId,
    limit: 5,
  });

  // Get our club team IDs for statistics calculation
  const ourClubTeamIds = useMemo(() => {
    if (!headToHeadMatches.length) return [];

    // Extract unique team IDs that belong to our club from the matches
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

  // Get opponent club ID for video filtering
  // Relationship: opponentTeam.club_category_id → club_categories.club_id
  const [opponentClubId, setOpponentClubId] = useState<string | null>(null);
  const [clubIdLoading, setClubIdLoading] = useState(false);

  // Fetch club ID from club_category_id
  useEffect(() => {
    const fetchClubId = async () => {
      // Validate that we have a valid club_category_id
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

  // State for videos
  const [opponentVideos, setOpponentVideos] = useState<any[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState<string | null>(null);

  // Fetch videos for opponent club (fallback)
  const fetchOpponentVideos = useCallback(async (filters: any) => {
    try {
      setVideosLoading(true);
      setVideosError(null);

      const supabase = createClient();

      // Validate filters before querying
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

      // Build query based on available filters
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
      console.error('Error fetching opponent videos:', error);
      setVideosError(error instanceof Error ? error.message : 'Failed to fetch videos');
      setOpponentVideos([]);
    } finally {
      setVideosLoading(false);
    }
  }, []);

  // Process videos to include match information
  const processedVideos = useMemo(() => {
    return opponentVideos.map((video) => {
      // Extract match information from match_videos relationship
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

  // Filter videos by opponent team name if no club ID is available
  const filteredOpponentVideos = useMemo(() => {
    if (!opponentTeam?.name || opponentClubId) {
      // If we have club ID, use all videos (already filtered by club_id)
      return processedVideos;
    }

    // Filter by team name in video title or description
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

  // Fetch videos when match is selected and club ID is available
  useEffect(() => {
    if (selectedMatch?.category_id && selectedMatch?.id && !clubIdLoading) {
      const fetchKey = `${opponentClubId || 'no-club'}-${selectedMatch.category_id}`;

      if (opponentClubId) {
        // Fetch videos by club_id and category_id (opponent videos)
        fetchOpponentVideos({
          club_id: opponentClubId,
          category_id: selectedMatch.category_id,
          is_active: true,
        });
      } else {
        // Fallback: fetch all videos for the category and filter by team name
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

  if (!selectedMatch) {
    return null;
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <ClipboardDocumentListIcon className="w-5 h-5 text-purple-600 flex-shrink-0" />
          <h3 className="text-lg sm:text-xl font-semibold truncate">Strategie a příprava</h3>
        </div>
        <Button isIconOnly variant="light" size="sm" onPress={onClose} className="flex-shrink-0">
          <XMarkIcon className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardBody className="p-0">
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
          <h4 className="font-semibold text-base sm:text-lg mb-2">Vybraný zápas</h4>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>
              <strong>Datum:</strong> {new Date(selectedMatch.date).toLocaleDateString('cs-CZ')}
            </p>
            <p>
              <strong>Čas:</strong>{' '}
              {new Date(selectedMatch.date).toLocaleTimeString('cs-CZ', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p>
              <strong>Domácí:</strong> {selectedMatch.home_team?.name || 'Neznámý tým'}
            </p>
            <p>
              <strong>Hosté:</strong> {selectedMatch.away_team?.name || 'Neznámý tým'}
            </p>
            {opponentTeam && (
              <p className="mt-2 text-purple-600 dark:text-purple-400">
                <strong>Soupeř:</strong> {opponentTeam.name}
              </p>
            )}
          </div>
        </div>

        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          className="px-2 sm:px-4 mt-4"
          variant="solid"
        >
          <Tab key="strategy" title="Strategie">
            <TabWithStrategy />
          </Tab>

          <Tab key="videos" title="Videa soupeře">
            <TabWithVideos
              videosError={videosError}
              videosLoading={videosLoading}
              filteredOpponentVideos={filteredOpponentVideos}
              opponentTeam={opponentTeam}
            />
          </Tab>
          <Tab key="previousMatches" title="Předchozí zápasy soupeře">
            <TabWithPreviousMatches
              previousMatchesError={previousMatchesError?.message || null}
              previousMatchesLoading={previousMatchesLoading}
              previousMatches={previousMatches}
              opponentTeam={opponentTeam}
            />
          </Tab>
          <Tab key="headToHead" title="Vzájemné zápasy">
            <TabWithHeadToHead
              headToHeadError={headToHeadError?.message || null}
              headToHeadLoading={headToHeadLoading}
              headToHeadMatches={headToHeadMatches}
              opponentTeam={opponentTeam}
              ourClubTeamIds={ourClubTeamIds}
            />
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
}

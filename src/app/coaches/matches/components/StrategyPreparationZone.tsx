'use client';

import React, {useState, useEffect, useMemo, useRef, useCallback} from 'react';
import {Card, CardHeader, CardBody, Button} from '@heroui/react';
import {Tabs, Tab} from '@heroui/tabs';
import {ClipboardDocumentListIcon, XMarkIcon, VideoCameraIcon} from '@heroicons/react/24/outline';
import {useVideos} from '@/hooks/useVideos';
import CompactVideoList from './CompactVideoList';

interface StrategyPreparationZoneProps {
  selectedMatch: any | null;
  onClose: () => void;
}

export default function StrategyPreparationZone({
  selectedMatch,
  onClose,
}: StrategyPreparationZoneProps) {
  const [activeTab, setActiveTab] = useState('strategy');
  const fetchedForRef = useRef<string | null>(null);

  // Reset fetch tracking when match changes
  useEffect(() => {
    fetchedForRef.current = null;
  }, [selectedMatch?.id]);

  // Get opponent team info
  const opponentTeam = useMemo(() => {
    if (!selectedMatch) return null;

    // Determine which team is the opponent (not our club)
    const homeIsOwnClub =
      selectedMatch.home_team?.is_own_club || selectedMatch.home_team_is_own_club;
    const awayIsOwnClub =
      selectedMatch.away_team?.is_own_club || selectedMatch.away_team_is_own_club;

    console.log('Opponent team detection:', {
      homeTeam: selectedMatch.home_team?.name,
      awayTeam: selectedMatch.away_team?.name,
      homeIsOwnClub,
      awayIsOwnClub,
      homeTeamData: selectedMatch.home_team,
      awayTeamData: selectedMatch.away_team,
    });

    if (homeIsOwnClub && !awayIsOwnClub) {
      return selectedMatch.away_team;
    } else if (!homeIsOwnClub && awayIsOwnClub) {
      return selectedMatch.home_team;
    }

    return null;
  }, [selectedMatch]);

  // Get opponent club ID for video filtering
  // Relationship: match.home_team/away_team → team.club_category.club.id = videos.club_id
  const opponentClubId = useMemo(() => {
    if (!opponentTeam) return null;

    // Try multiple possible paths for club ID
    const clubId =
      opponentTeam.club_category?.club?.id ||
      opponentTeam.club_id ||
      opponentTeam.club?.id ||
      opponentTeam.id; // Fallback to team ID

    console.log('Opponent club ID detection:', {
      opponentTeam: opponentTeam.name,
      clubId,
      opponentTeamData: opponentTeam,
      possiblePaths: {
        'team.club_category.club.id': opponentTeam.club_category?.club?.id,
        'team.club_id': opponentTeam.club_id,
        'team.club.id': opponentTeam.club?.id,
        'team.id': opponentTeam.id,
      },
      allKeys: Object.keys(opponentTeam),
      fullStructure: JSON.stringify(opponentTeam, null, 2),
    });
    return clubId;
  }, [opponentTeam]);

  // Fetch videos for the opponent club
  const {
    videos: opponentVideos,
    loading: videosLoading,
    error: videosError,
    fetchVideos: fetchOpponentVideos,
  } = useVideos({
    assignedCategories: [],
    enableAccessControl: false,
    itemsPerPage: 50,
  });

  // Memoized fetch function to prevent re-creation
  const fetchVideosMemoized = useCallback(
    (filters: any) => {
      fetchOpponentVideos(filters);
    },
    [fetchOpponentVideos]
  );

  // Filter videos by opponent team name if no club ID is available
  const filteredOpponentVideos = useMemo(() => {
    if (!opponentTeam?.name || opponentClubId) {
      // If we have club ID, use all videos (already filtered by club_id)
      return opponentVideos;
    }

    // Filter by team name in video title or description
    const teamName = opponentTeam.name.toLowerCase();
    const filtered = opponentVideos.filter((video) => {
      const title = video.title?.toLowerCase() || '';
      const description = video.description?.toLowerCase() || '';
      const clubName = video.clubs?.name?.toLowerCase() || '';

      return (
        title.includes(teamName) || description.includes(teamName) || clubName.includes(teamName)
      );
    });

    console.log('Filtering videos by team name:', {
      teamName,
      totalVideos: opponentVideos.length,
      filteredVideos: filtered.length,
      videos: opponentVideos.map((v) => ({title: v.title, club: v.clubs?.name})),
    });

    return filtered;
  }, [opponentVideos, opponentTeam?.name, opponentClubId]);

  // Debug video loading state
  useEffect(() => {
    console.log('Video loading state:', {
      videosLoading,
      videosError,
      videosCount: opponentVideos.length,
      filteredCount: filteredOpponentVideos.length,
      opponentClubId,
      categoryId: selectedMatch?.category_id,
    });
  }, [
    videosLoading,
    videosError,
    opponentVideos.length,
    filteredOpponentVideos.length,
    opponentClubId,
    selectedMatch?.category_id,
  ]);

  // Fetch opponent videos when opponent club is identified
  useEffect(() => {
    if (selectedMatch?.category_id) {
      const fetchKey = `${opponentClubId || 'no-club'}-${selectedMatch.category_id}`;

      // Prevent duplicate fetches
      if (fetchedForRef.current === fetchKey) {
        console.log('Already fetched videos for this opponent, skipping...');
        return;
      }

      console.log('Fetching opponent videos for:', {
        opponentClubId,
        categoryId: selectedMatch.category_id,
        opponentTeam: opponentTeam?.name,
        hasClubId: !!opponentClubId,
        fetchKey,
        relationship:
          'match.category_id = videos.category_id AND team.club_category.club.id = videos.club_id',
      });

      // Mark as fetched
      fetchedForRef.current = fetchKey;

      if (opponentClubId) {
        // Fetch videos by club_id and category_id (correct relationship)
        fetchVideosMemoized({
          club_id: opponentClubId,
          category_id: selectedMatch.category_id,
          is_active: true,
        });
      } else {
        // Fallback: fetch all videos for the category and filter by team name
        console.log(
          'No club ID found, fetching all videos for category and filtering by team name'
        );
        fetchVideosMemoized({
          category_id: selectedMatch.category_id,
          is_active: true,
        });
      }
    }
  }, [opponentClubId, selectedMatch?.category_id, opponentTeam?.name, fetchVideosMemoized]);

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
        >
          <Tab key="strategy" title="Strategie">
            <div className="space-y-3 py-4 mx-1 sm:mx-2">
              <Card>
                <CardHeader className="pb-2">
                  <h5 className="font-medium text-sm sm:text-base">Taktické poznámky</h5>
                </CardHeader>
                <CardBody className="pt-0">
                  <textarea
                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none"
                    rows={3}
                    placeholder="Zadejte taktické poznámky pro tento zápas..."
                  />
                </CardBody>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <h5 className="font-medium text-sm sm:text-base">Sestava</h5>
                </CardHeader>
                <CardBody className="pt-0">
                  <textarea
                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none"
                    rows={3}
                    placeholder="Plánovaná sestava..."
                  />
                </CardBody>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <h5 className="font-medium text-sm sm:text-base">Příprava hráčů</h5>
                </CardHeader>
                <CardBody className="pt-0">
                  <textarea
                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none"
                    rows={3}
                    placeholder="Speciální příprava pro jednotlivé hráče..."
                  />
                </CardBody>
              </Card>

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button color="primary" size="sm" className="w-full sm:w-auto">
                  Uložit poznámky
                </Button>
                <Button variant="light" size="sm" className="w-full sm:w-auto">
                  Exportovat
                </Button>
              </div>
            </div>
          </Tab>

          <Tab key="videos" title="Videa soupeře">
            <div className="py-4">
              {videosError && (
                <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700 mb-4">
                  <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">
                    Chyba při načítání videí: {videosError}
                  </p>
                </div>
              )}
              <CompactVideoList
                videos={filteredOpponentVideos}
                loading={videosLoading}
                title={`Videa týmu ${opponentTeam?.name || 'soupeře'}`}
                emptyMessage={`Žádná videa týmu ${opponentTeam?.name || 'soupeře'} nejsou k dispozici`}
              />
            </div>
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
}

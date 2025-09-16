'use client';

import React, {useState, useEffect, useMemo, useRef, useCallback} from 'react';
import {Card, CardHeader, CardBody, Button} from '@heroui/react';
import {Tabs, Tab} from '@heroui/tabs';
import {ClipboardDocumentListIcon, XMarkIcon, VideoCameraIcon} from '@heroicons/react/24/outline';
import {useVideos} from '@/hooks/useVideos';
import CompactVideoList from './CompactVideoList';
import MatchRow from '@/components/match/MatchRow';
import {createClient} from '@/utils/supabase/client';
import {LoadingSpinner} from '@/components';
import {Match} from '@/types';
interface StrategyPreparationZoneProps {
  selectedMatch: Match;
  onClose: () => void;
}

export default function StrategyPreparationZone({
  selectedMatch,
  onClose,
}: StrategyPreparationZoneProps) {
  const [activeTab, setActiveTab] = useState('strategy');
  const [previousMatches, setPreviousMatches] = useState<any[]>([]);
  const [previousMatchesLoading, setPreviousMatchesLoading] = useState(false);
  const [previousMatchesError, setPreviousMatchesError] = useState<string | null>(null);
  const fetchedForRef = useRef<string | null>(null);

  // Reset fetch tracking when match changes
  useEffect(() => {
    fetchedForRef.current = null;
    setPreviousMatches([]);
    setPreviousMatchesError(null);
  }, [selectedMatch?.id]);

  // Function to fetch opponent's previous matches
  const fetchOpponentPreviousMatches = useCallback(
    async (opponentClubId: string, categoryId: string) => {
      try {
        setPreviousMatchesLoading(true);
        setPreviousMatchesError(null);

        // Validate input parameters
        if (!opponentClubId || opponentClubId === 'undefined' || opponentClubId === 'null') {
          console.log('Invalid opponentClubId, skipping previous matches fetch:', opponentClubId);
          setPreviousMatches([]);
          return;
        }

        if (!categoryId || categoryId === 'undefined' || categoryId === 'null') {
          console.log('Invalid categoryId, skipping previous matches fetch:', categoryId);
          setPreviousMatches([]);
          return;
        }

        const supabase = createClient();

        console.log('🔍 Fetching previous matches for:', {
          opponentClubId,
          categoryId,
          step: 'Step 1: Finding club_categories',
        });

        // Get all teams for the opponent club in this category
        // Step 1: Find club_categories for the opponent club in this category
        const {data: clubCategories, error: clubCategoriesError} = await supabase
          .from('club_categories')
          .select('id')
          .eq('club_id', opponentClubId)
          .eq('category_id', categoryId);

        if (clubCategoriesError) {
          console.error('❌ Error fetching club_categories:', clubCategoriesError);
          throw clubCategoriesError;
        }

        console.log('📊 Found club_categories:', clubCategories?.length || 0, clubCategories);

        if (!clubCategories || clubCategories.length === 0) {
          console.log('⚠️ No club_categories found for opponent club and category');
          setPreviousMatches([]);
          return;
        }

        const clubCategoryIds = clubCategories.map((cc: any) => cc.id);
        console.log('🔗 Club category IDs:', clubCategoryIds);

        // Step 2: Get teams from club_category_teams
        console.log('🔍 Step 2: Finding teams for club_categories');
        const {data: teams, error: teamsError} = await supabase
          .from('club_category_teams')
          .select(
            `
          id,
          team_suffix,
          club_category:club_categories(
            club:clubs(id, name, short_name, logo_url, is_own_club)
          )
        `
          )
          .in('club_category_id', clubCategoryIds)
          .eq('is_active', true);

        if (teamsError) {
          console.error('❌ Error fetching teams:', teamsError);
          throw teamsError;
        }

        console.log('📊 Found teams:', teams?.length || 0, teams);

        if (!teams || teams.length === 0) {
          console.log('⚠️ No teams found for club_categories');
          setPreviousMatches([]);
          return;
        }

        const teamIds = teams.map((team: any) => team.id);
        console.log('🔗 Team IDs for match search:', teamIds);

        // Get previous matches for these teams (completed matches only)
        console.log('🔍 Step 3: Finding matches for teams');
        const {data: matches, error: matchesError} = await supabase
          .from('matches')
          .select(
            `
          *,
          home_team:home_team_id(
            id,
            team_suffix,
            club_category:club_categories(
              club:clubs(id, name, short_name, logo_url, is_own_club)
            )
          ),
          away_team:away_team_id(
            id,
            team_suffix,
            club_category:club_categories(
              club:clubs(id, name, short_name, logo_url, is_own_club)
            )
          ),
          category:category_id(id, name, description)
        `
          )
          .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`)
          .eq('status', 'completed')
          .order('date', {ascending: false})
          .limit(10); // Limit to 10 most recent matches

        if (matchesError) {
          console.error('❌ Error fetching matches:', matchesError);
          throw matchesError;
        }

        console.log('📊 Found matches:', matches?.length || 0, matches);

        // Transform matches with team names (similar to other match queries)
        const transformedMatches =
          matches?.map((match: any) => {
            const homeTeam = match.home_team;
            const awayTeam = match.away_team;

            // Simple team name transformation (without complex suffix logic for now)
            const homeTeamName = homeTeam?.club_category?.club?.name || 'Unknown team';
            const awayTeamName = awayTeam?.club_category?.club?.name || 'Unknown team';

            return {
              ...match,
              home_team: {
                id: homeTeam?.id,
                name: homeTeamName,
                short_name: homeTeam?.club_category?.club?.short_name,
                is_own_club: homeTeam?.club_category?.club?.is_own_club,
                logo_url: homeTeam?.club_category?.club?.logo_url,
              },
              away_team: {
                id: awayTeam?.id,
                name: awayTeamName,
                short_name: awayTeam?.club_category?.club?.short_name,
                is_own_club: awayTeam?.club_category?.club?.is_own_club,
                logo_url: awayTeam?.club_category?.club?.logo_url,
              },
            };
          }) || [];

        console.log(
          '✅ Successfully fetched and transformed matches:',
          transformedMatches?.length || 0
        );
        setPreviousMatches(transformedMatches);
      } catch (error) {
        console.error('❌ Error fetching opponent previous matches:', error);
        setPreviousMatchesError(
          error instanceof Error ? error.message : 'Failed to fetch previous matches'
        );
        setPreviousMatches([]);
      } finally {
        setPreviousMatchesLoading(false);
      }
    },
    []
  );

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
        console.log('No valid club_category_id found:', opponentTeam?.club_category_id);
        setOpponentClubId(null);
        return;
      }

      try {
        setClubIdLoading(true);
        const supabase = createClient();

        console.log('Fetching club ID for club_category_id:', opponentTeam.club_category_id);

        const {data: clubCategory, error} = await supabase
          .from('club_categories')
          .select('club_id')
          .eq('id', opponentTeam.club_category_id)
          .single();

        if (error) {
          console.error('Error fetching club ID:', error);
          setOpponentClubId(null);
        } else {
          console.log('Successfully fetched club ID:', clubCategory?.club_id);
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
        console.log('Invalid club_id, skipping video fetch:', filters.club_id);
        setOpponentVideos([]);
        return;
      }

      if (
        filters.category_id &&
        (filters.category_id === 'undefined' || filters.category_id === 'null')
      ) {
        console.log('Invalid category_id, skipping video fetch:', filters.category_id);
        setOpponentVideos([]);
        return;
      }

      console.log('Fetching videos with filters:', filters);

      // Build query based on available filters
      let query = supabase
        .from('videos')
        .select(
          `
          *,
          categories(id, name),
          clubs(id, name, short_name)
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

      console.log('Successfully fetched videos:', videos?.length || 0);
      setOpponentVideos(videos || []);
    } catch (error) {
      console.error('Error fetching opponent videos:', error);
      setVideosError(error instanceof Error ? error.message : 'Failed to fetch videos');
      setOpponentVideos([]);
    } finally {
      setVideosLoading(false);
    }
  }, []);

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

  // Fetch videos when match is selected and club ID is available
  useEffect(() => {
    if (selectedMatch?.category_id && selectedMatch?.id && !clubIdLoading) {
      const fetchKey = `${opponentClubId || 'no-club'}-${selectedMatch.category_id}`;

      // Prevent duplicate fetches
      if (fetchedForRef.current === fetchKey) {
        console.log('Already fetched videos for this match, skipping...');
        return;
      }

      console.log('Fetching videos for:', {
        opponentClubId,
        categoryId: selectedMatch.category_id,
        matchId: selectedMatch.id,
        opponentTeam: opponentTeam?.name,
        hasClubId: !!opponentClubId,
        fetchKey,
      });

      // Mark as fetched
      fetchedForRef.current = fetchKey;

      if (opponentClubId) {
        // Fetch videos by club_id and category_id (opponent videos)
        console.log('Fetching opponent videos by club_id and category_id');
        fetchOpponentVideos({
          club_id: opponentClubId,
          category_id: selectedMatch.category_id,
          is_active: true,
        });
      } else {
        // Fallback: fetch all videos for the category and filter by team name
        console.log(
          'No club ID found, fetching all videos for category and filtering by team name'
        );
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

  // Fetch opponent's previous matches when opponent club is identified
  useEffect(() => {
    console.log('🔄 Previous matches effect triggered:', {
      opponentClubId,
      categoryId: selectedMatch?.category_id,
      opponentTeam: opponentTeam?.name,
      hasOpponentClubId: !!opponentClubId,
      hasCategoryId: !!selectedMatch?.category_id,
    });

    if (opponentClubId && selectedMatch?.category_id) {
      console.log('🚀 Starting previous matches fetch for:', {
        opponentClubId,
        categoryId: selectedMatch.category_id,
        opponentTeam: opponentTeam?.name,
      });

      fetchOpponentPreviousMatches(opponentClubId, selectedMatch.category_id);
    } else {
      console.log('⏸️ Skipping previous matches fetch - missing required data');
    }
  }, [
    opponentClubId,
    selectedMatch?.category_id,
    opponentTeam?.name,
    fetchOpponentPreviousMatches,
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
          <Tab key="previousMatches" title="Předchozí zápasy">
            <div className="py-4">
              {previousMatchesError && (
                <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700 mb-4">
                  <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">
                    Chyba při načítání předchozích zápasů: {previousMatchesError}
                  </p>
                </div>
              )}

              {previousMatchesLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : previousMatches.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Posledních {previousMatches.length} zápasů týmu{' '}
                    {opponentTeam?.name || 'soupeře'}:
                  </p>
                  {previousMatches.map((match) => (
                    <MatchRow key={match.id} match={match} redirectionLinks={false} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">
                    Žádné předchozí zápasy týmu {opponentTeam?.name || 'soupeře'} nejsou k dispozici
                  </p>
                </div>
              )}
            </div>
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
}

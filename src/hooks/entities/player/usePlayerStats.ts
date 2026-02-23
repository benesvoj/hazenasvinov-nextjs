'use client';

import {useState, useEffect, useMemo} from 'react';

import {useUser} from '@/contexts';
import {useSupabaseClient} from '@/hooks';

export interface PlayerStats {
  id: string;
  name: string;
  surname: string;
  registration_number: string;
  jersey_number?: number;
  goals: number;
  yellow_cards: number;
  red_cards_5min: number;
  red_cards_10min: number;
  red_cards_personal: number;
  matches_played: number;
  total_cards: number;
  position?: string;
  is_captain: boolean;
  average_goals_per_match: number;
}

export interface UsePlayerStatsResult {
  topScorers: PlayerStats[];
  yellowCardPlayers: PlayerStats[];
  redCardPlayers: PlayerStats[];
  loading: boolean;
  error: string | null;
}

export function usePlayerStats(categoryId?: string): UsePlayerStatsResult {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {user, userCategories, getCurrentUserCategories} = useUser();

  const supabase = useSupabaseClient();

  useEffect(() => {
    const fetchPlayerStats = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Get user's assigned category
        const assignedCategoryIds = await getCurrentUserCategories();
        if (assignedCategoryIds.length === 0) {
          setPlayerStats([]);
          return;
        }

        // If categoryId is provided, filter by that category, otherwise use all assigned category
        const categoryIdsToUse = categoryId ? [categoryId] : assignedCategoryIds;

        const playerStatsMap = new Map<string, PlayerStats>();

        // Use a single query with joins to get all data at once
        // Filter by user's assigned category
        const {data: lineupPlayers, error: lineupPlayersError} = await supabase
          .from('lineup_players')
          .select(
            `
            *,
            lineup:lineups!inner(
              id,
              team_id,
              is_home_team,
              match:matches!inner(
                id,
                status,
                home_team_id,
                away_team_id,
                category_id
              )
            ),
            member:members(id, name, surname, registration_number, category_id)
          `
          )
          .eq('lineup.match.status', 'completed')
          .in('lineup.match.category_id', categoryIdsToUse);

        if (lineupPlayersError) {
          setPlayerStats([]);
          return;
        }

        if (!lineupPlayers || lineupPlayers.length === 0) {
          setPlayerStats([]);
          return;
        }

        // Process each player's statistics
        lineupPlayers.forEach((player: any) => {
          if (!player.member) return; // Skip external player-manager

          const playerId = player.member.id;
          const playerName = player.member.name;
          const playerSurname = player.member.surname;
          const registrationNumber = player.member.registration_number;

          // Get or create player stats
          let stats = playerStatsMap.get(playerId);
          if (!stats) {
            stats = {
              id: playerId,
              name: playerName,
              surname: playerSurname,
              registration_number: registrationNumber,
              jersey_number: player.jersey_number,
              goals: 0,
              yellow_cards: 0,
              red_cards_5min: 0,
              red_cards_10min: 0,
              red_cards_personal: 0,
              matches_played: 0,
              total_cards: 0,
              position: player.position,
              is_captain: player.is_captain || false,
              average_goals_per_match: 0,
            };
            playerStatsMap.set(playerId, stats);
          }

          // Update stats
          stats.matches_played++;
          stats.goals += player.goals || 0;
          stats.yellow_cards += player.yellow_cards || 0;
          stats.red_cards_5min += player.red_cards_5min || 0;
          stats.red_cards_10min += player.red_cards_10min || 0;
          stats.red_cards_personal += player.red_cards_personal || 0;

          // Calculate total red cards and total cards
          const totalRedCards =
            stats.red_cards_5min + stats.red_cards_10min + stats.red_cards_personal;
          stats.total_cards = stats.yellow_cards + totalRedCards;

          // Update position if not set
          if (!stats.position && player.position) {
            stats.position = player.position;
          }

          // Update captain status
          if (player.is_captain) {
            stats.is_captain = true;
          }
        });

        // Calculate average goals per match for each player
        const statsArray = Array.from(playerStatsMap.values()).map((stats) => ({
          ...stats,
          average_goals_per_match:
            stats.matches_played > 0 ? stats.goals / stats.matches_played : 0,
        }));

        setPlayerStats(statsArray);
      } catch (err) {
        console.error('Error fetching player statistics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setPlayerStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerStats();
  }, [user?.id, getCurrentUserCategories, categoryId]);

  // Memoize the sorted results
  const topScorers = useMemo(() => {
    return [...playerStats]
      .filter((player) => player.goals > 0)
      .sort((a, b) => {
        if (b.goals !== a.goals) return b.goals - a.goals;
        return b.average_goals_per_match - a.average_goals_per_match;
      })
      .slice(0, 5);
  }, [playerStats]);

  const yellowCardPlayers = useMemo(() => {
    return [...playerStats]
      .filter((player) => player.yellow_cards > 0)
      .sort((a, b) => b.yellow_cards - a.yellow_cards)
      .slice(0, 5);
  }, [playerStats]);

  const redCardPlayers = useMemo(() => {
    return [...playerStats]
      .filter(
        (player) => player.red_cards_5min + player.red_cards_10min + player.red_cards_personal > 0
      )
      .sort((a, b) => {
        const aRedCards = a.red_cards_5min + a.red_cards_10min + a.red_cards_personal;
        const bRedCards = b.red_cards_5min + b.red_cards_10min + b.red_cards_personal;
        return bRedCards - aRedCards;
      })
      .slice(0, 5);
  }, [playerStats]);

  return {
    topScorers,
    yellowCardPlayers,
    redCardPlayers,
    loading,
    error,
  };
}

'use client';
import {useState, useEffect} from 'react';

import {createClient} from '@/utils/supabase/client';

import {Match} from '@/types';

export interface PlayerMatchStats {
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
}

export interface UseMatchLineupStatsResult {
  playerStats: PlayerMatchStats[];
  loading: boolean;
  error: string | null;
}

export function useMatchLineupStats(matches: Match[]): UseMatchLineupStatsResult {
  const [playerStats, setPlayerStats] = useState<PlayerMatchStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLineupStats = async () => {
      if (!matches || matches.length === 0) {
        setPlayerStats([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const playerStatsMap = new Map<string, PlayerMatchStats>();

        // Process each completed match
        for (const match of matches) {
          if (match.status !== 'completed') continue;

          // Determine which team is our club
          const isHomeTeam = match.home_team_is_own_club;
          const ourTeamId = isHomeTeam ? match.home_team_id : match.away_team_id;

          if (!ourTeamId) continue;

          try {
            // Fetch lineup for our team in this match
            const {data: lineupData, error: lineupError} = await supabase
              .from('lineups')
              .select('id')
              .eq('match_id', match.id)
              .eq('team_id', ourTeamId)
              .maybeSingle();

            if (lineupError) {
              console.warn(`Error fetching lineup for match ${match.id}:`, lineupError);
              continue;
            }

            if (!lineupData) {
              console.log(`No lineup data for match ${match.id}, team ${ourTeamId}`);
              continue;
            }

            // Fetch player-manager from lineup
            const {data: playersData, error: playersError} = await supabase
              .from('lineup_players')
              .select(
                `
                *,
                member:members(id, name, surname, registration_number)
              `
              )
              .eq('lineup_id', lineupData.id);

            if (playersError) {
              console.warn(`Error fetching lineup players for match ${match.id}:`, playersError);
              continue;
            }

            // Process each player's statistics
            (playersData || []).forEach((player: any) => {
              if (!player.member) return; // Skip external player-manager for now

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
              stats.total_cards =
                stats.yellow_cards +
                stats.red_cards_5min +
                stats.red_cards_10min +
                stats.red_cards_personal;

              // Update position if not set
              if (!stats.position && player.position) {
                stats.position = player.position;
              }

              // Update captain status
              if (player.is_captain) {
                stats.is_captain = true;
              }
            });
          } catch (matchError) {
            console.warn(`Error processing match ${match.id}:`, matchError);
            continue;
          }
        }

        // Convert map to array and sort by goals, then by total cards
        const statsArray = Array.from(playerStatsMap.values()).sort((a, b) => {
          if (b.goals !== a.goals) return b.goals - a.goals;
          return a.total_cards - b.total_cards;
        });

        setPlayerStats(statsArray);
        console.log('Processed player stats:', statsArray.length, 'players');
      } catch (err) {
        console.error('Error fetching lineup statistics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setPlayerStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLineupStats();
  }, [matches]);

  return {
    playerStats,
    loading,
    error,
  };
}

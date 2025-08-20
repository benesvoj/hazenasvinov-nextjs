import { useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  LineupFormData, 
  LineupPlayerFormData, 
  LineupCoachFormData, 
  LineupSummary, 
  LineupValidation,
  ExternalPlayer
} from '@/types/types';

const supabase = createClient();

export const useLineupData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search external players
  const searchExternalPlayers = useCallback(async (searchTerm: string): Promise<ExternalPlayer[]> => {
    try {
      const { data, error } = await supabase
        .rpc('search_external_players', {
          search_term: searchTerm
        });

      if (error) {
        console.warn('Error searching external players:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error('Error searching external players:', error);
      return [];
    }
  }, []);

  // Get or create external player
  const getOrCreateExternalPlayer = useCallback(async (
    registrationNumber: string,
    name: string,
    surname: string,
    position: string
  ): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('get_or_create_external_player', {
        p_registration_number: registrationNumber,
        p_name: name,
        p_surname: surname,
        p_position: position
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting/creating external player:', error);
      throw error;
    }
  }, [supabase]);

  // Fetch lineup data
  const fetchLineup = useCallback(async (matchId: string, teamId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Check if lineup exists
      const { data: lineupData, error: lineupError } = await supabase
        .from('lineups')
        .select('*')
        .eq('match_id', matchId)
        .eq('team_id', teamId)
        .single();

      if (lineupError) {
        if (lineupError.code === 'PGRST116') {
          // No lineup found - this is normal for new matches
          console.log('No lineup found for match/team, returning empty data');
          return {
            players: [],
            coaches: []
          };
        }
        throw lineupError;
      }

      // Fetch players
      const { data: playersData, error: playersError } = await supabase
        .from('lineup_players')
        .select(`
          *,
          member:members(id, name, surname, registration_number),
          external_player:external_players(id, name, surname, registration_number)
        `)
        .eq('lineup_id', lineupData.id);

      if (playersError) {
        console.warn('Error fetching lineup players, table might not exist yet:', playersError);
        // Return empty data instead of throwing error
        return {
          players: [],
          coaches: []
        };
      }

      // Process players data to include display names
      const processedPlayers = (playersData || []).map((player: any) => {
        if (player.member) {
          // Internal player
          return {
            ...player,
            display_name: `${player.member.name} ${player.member.surname} (${player.member.registration_number})`,
            is_external: false
          };
        } else if (player.external_player) {
          // External player
          return {
            ...player,
            display_name: `${player.external_player.name} ${player.external_player.surname} (${player.external_player.registration_number})`,
            is_external: true,
            external_name: player.external_player.name,
            external_surname: player.external_player.surname,
            external_registration_number: player.external_player.registration_number
          };
        }
        return player;
      });

      // Fetch coaches
      const { data: coachesData, error: coachesError } = await supabase
        .from('lineup_coaches')
        .select(`
          *,
          member:members(id, name, surname, registration_number)
        `)
        .eq('lineup_id', lineupData.id);

      if (coachesError) {
        console.warn('Error fetching lineup coaches, table might not exist yet:', coachesError);
        // Return empty data instead of throwing error
        return {
          players: [],
          coaches: []
        };
      }

      return {
        players: processedPlayers || [],
        coaches: coachesData || []
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Chyba při načítání sestavy';
      setError(errorMessage);
      console.error('Error fetching lineup:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Fetch lineup data by lineup ID
  const fetchLineupById = useCallback(async (lineupId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Check if lineup exists
      const { data: lineupData, error: lineupError } = await supabase
        .from('lineups')
        .select('*')
        .eq('id', lineupId)
        .single();

      if (lineupError) {
        if (lineupError.code === 'PGRST116') {
          // No lineup found
          console.log('No lineup found with ID, returning empty data');
          return {
            players: [],
            coaches: []
          };
        }
        throw lineupError;
      }

      // Fetch players
      const { data: playersData, error: playersError } = await supabase
        .from('lineup_players')
        .select(`
          *,
          member:members(id, name, surname, registration_number),
          external_player:external_players(id, name, surname, registration_number)
        `)
        .eq('lineup_id', lineupId);

      if (playersError) {
        console.warn('Error fetching lineup players, table might not exist yet:', playersError);
        // Return empty data instead of throwing error
        return {
          players: [],
          coaches: []
        };
      }

      // Process players data to include display names
      const processedPlayers = (playersData || []).map((player: any) => {
        if (player.member) {
          // Internal player
          return {
            ...player,
            display_name: `${player.member.name} ${player.member.surname} (${player.member.registration_number})`,
            is_external: false
          };
        } else if (player.external_player) {
          // External player
          return {
            ...player,
            display_name: `${player.external_player.name} ${player.external_player.surname} (${player.external_player.registration_number})`,
            is_external: true,
            external_name: player.external_player.name,
            external_surname: player.external_player.surname,
            external_registration_number: player.external_player.registration_number
          };
        }
        return player;
      });

      // Fetch coaches
      const { data: coachesData, error: coachesError } = await supabase
        .from('lineup_coaches')
        .select(`
          *,
          member:members(id, name, surname, registration_number)
        `)
        .eq('lineup_id', lineupId);

      if (coachesError) {
        console.warn('Error fetching lineup coaches, table might not exist yet:', coachesError);
        // Return empty data instead of throwing error
        return {
          players: [],
          coaches: []
        };
      }

      return {
        players: processedPlayers || [],
        coaches: coachesData || []
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Chyba při načítání sestavy';
      setError(errorMessage);
      console.error('Error fetching lineup by ID:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Delete lineup
  const deleteLineup = useCallback(async (lineupId: string): Promise<void> => {
    try {
      // Delete players first
      const { error: playersError } = await supabase
        .from('lineup_players')
        .delete()
        .eq('lineup_id', lineupId);

      if (playersError) {
        console.warn('Error deleting lineup players:', playersError);
      }

      // Delete coaches
      const { error: coachesError } = await supabase
        .from('lineup_coaches')
        .delete()
        .eq('lineup_id', lineupId);

      if (coachesError) {
        console.warn('Error deleting lineup coaches:', coachesError);
      }

      // Delete the lineup itself
      const { error: lineupError } = await supabase
        .from('lineups')
        .delete()
        .eq('id', lineupId);

      if (lineupError) throw lineupError;
    } catch (error: any) {
      if (error.code === '42P01') {
        throw new Error('Tabulka sestav ještě nebyla vytvořena. Spusťte prosím SQL skript pro vytvoření systému sestav.');
      }
      throw error;
    }
  }, [supabase]);

  // Save lineup
  const saveLineup = useCallback(async (lineupId: string, formData: LineupFormData): Promise<void> => {
    try {
      // First verify that the match exists
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('id')
        .eq('id', formData.match_id)
        .single();

      if (matchError) {
        console.error('Match not found:', matchError);
        throw new Error(`Zápas s ID ${formData.match_id} nebyl nalezen v databázi.`);
      }

      if (!matchData) {
        throw new Error(`Zápas s ID ${formData.match_id} nebyl nalezen v databázi.`);
      }

      // Verify that the team exists
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('id', formData.team_id)
        .single();

      if (teamError) {
        console.error('Team not found:', teamError);
        throw new Error(`Tým s ID ${formData.team_id} nebyl nalezen v databázi.`);
      }

      if (!teamData) {
        throw new Error(`Tým s ID ${formData.team_id} nebyl nalezen v databázi.`);
      }

      console.log('Match and team verified, proceeding with lineup save:', { match: matchData, team: teamData });

      // Delete existing lineup data
      await deleteLineup(lineupId);

      // Insert new lineup
      const { error: lineupError } = await supabase
        .from('lineups')
        .insert({
          id: lineupId,
          match_id: formData.match_id,
          team_id: formData.team_id,
          is_home_team: formData.is_home_team
        });

      if (lineupError) throw lineupError;

      // Insert players
      for (const player of formData.players) {
        if (player.member_id) {
          // Internal player
          const { error: playerError } = await supabase
            .from('lineup_players')
            .insert({
              lineup_id: lineupId,
              member_id: player.member_id,
              position: player.position || 'field_player', // Ensure position is set
              role: player.role || 'player' // Ensure role is set
            });

          if (playerError) {
            console.error('Error inserting internal player:', playerError, player);
            throw playerError;
          }
        } else if (player.external_name && player.external_surname && player.external_registration_number) {
          // External player
          const externalPlayerId = await getOrCreateExternalPlayer(
            player.external_registration_number,
            player.external_name,
            player.external_surname,
            player.position || 'field_player'
          );

          const { error: playerError } = await supabase
            .from('lineup_players')
            .insert({
              lineup_id: lineupId,
              external_player_id: externalPlayerId,
              position: player.position || 'field_player', // Ensure position is set
              role: player.role || 'player' // Ensure role is set
            });

          if (playerError) {
            console.error('Error inserting external player:', playerError, player);
            throw playerError;
          }
        } else {
          // Player data is incomplete
          console.error('Incomplete player data:', player);
          throw new Error(`Neúplná data hráče: ${player.external_name || 'Neznámý hráč'}`);
        }
      }

      // Insert coaches
      for (const coach of formData.coaches) {
        if (coach.member_id && coach.role) {
          const { error: coachError } = await supabase
            .from('lineup_coaches')
            .insert({
              lineup_id: lineupId,
              member_id: coach.member_id,
              role: coach.role
            });

          if (coachError) {
            console.error('Error inserting coach:', coachError, coach);
            throw coachError;
          }
        } else {
          // Coach data is incomplete
          console.error('Incomplete coach data:', coach);
          throw new Error(`Neúplná data trenéra: ${coach.member_id || 'Neznámý trenér'}`);
        }
      }

      // Refresh data
      await fetchLineupById(lineupId);
    } catch (error: any) {
      if (error.code === '42P01') {
        throw new Error('Tabulka sestav ještě nebyla vytvořena. Spusťte prosím SQL skript pro vytvoření systému sestav.');
      }
      throw error;
    }
  }, [supabase, deleteLineup, fetchLineupById, getOrCreateExternalPlayer]);

  // Get lineup summary
  const getLineupSummary = useCallback(async (matchId: string, teamId: string): Promise<LineupSummary | null> => {
    try {
      // First try to get the summary from the database function
      const { data, error } = await supabase
        .rpc('get_lineup_summary', {
          match_uuid: matchId,
          team_uuid: teamId
        });

      if (error) {
        // If the database function doesn't exist or has type issues, calculate summary from local data
        console.warn('Database function get_lineup_summary not available, using fallback:', error);
        return calculateLineupSummaryFromData(matchId, teamId);
      }

      // Handle the case where data might be an array or single object
      if (Array.isArray(data)) {
        return data[0] || null;
      }
      
      return data || null;
    } catch (error: any) {
      console.error('Error getting lineup summary:', error);
      // Fallback to local calculation
      return calculateLineupSummaryFromData(matchId, teamId);
    }
  }, [supabase]);

  // Fallback function to calculate lineup summary from local data
  const calculateLineupSummaryFromData = useCallback(async (matchId: string, teamId: string): Promise<LineupSummary | null> => {
    try {
      // Get lineup data from the tables directly
      const { data: lineupData, error: lineupError } = await supabase
        .from('lineups')
        .select('id')
        .eq('match_id', matchId)
        .eq('team_id', teamId)
        .single();

      if (lineupError || !lineupData) {
        // No lineup exists yet
        return {
          total_players: 0,
          goalkeepers: 0,
          field_players: 0,
          coaches: 0,
          is_valid: false
        };
      }

      // Get players count
      const { data: playersData, error: playersError } = await supabase
        .from('lineup_players')
        .select('position')
        .eq('lineup_id', lineupData.id);

      if (playersError) throw playersError;

      // Get coaches count
      const { data: coachesData, error: coachesError } = await supabase
        .from('lineup_coaches')
        .select('id')
        .eq('lineup_id', lineupData.id);

      if (coachesError) throw coachesError;

      // Calculate summary
      const goalkeepers = playersData?.filter((p: any) => p.position === 'goalkeeper').length || 0;
      const fieldPlayers = playersData?.filter((p: any) => p.position === 'field_player').length || 0;
      const coaches = coachesData?.length || 0;
      const totalPlayers = goalkeepers + fieldPlayers;

      const is_valid = goalkeepers >= 1 && 
                      goalkeepers <= 2 && 
                      fieldPlayers >= 6 && 
                      fieldPlayers <= 13 && 
                      coaches <= 3;

      return {
        total_players: totalPlayers + coaches,
        goalkeepers,
        field_players: fieldPlayers,
        coaches,
        is_valid
      };
    } catch (error: any) {
      console.error('Error calculating lineup summary from data:', error);
      return null;
    }
  }, [supabase]);

  // Validate lineup data
  const validateLineupData = (formData: LineupFormData): LineupValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const goalkeepers = formData.players.filter(p => p.position === 'goalkeeper');
    const fieldPlayers = formData.players.filter(p => p.position === 'field_player');
    const coaches = formData.coaches;

    // Minimum requirements
    if (goalkeepers.length < 1) {
      errors.push('Musí být alespoň 1 brankář');
    }

    if (fieldPlayers.length < 6) {
      errors.push('Musí být alespoň 6 hráčů v poli');
    }

    if (goalkeepers.length + fieldPlayers.length < 7) {
      errors.push('Celkem musí být alespoň 7 hráčů');
    }

    // Maximum requirements
    if (goalkeepers.length > 2) {
      errors.push('Nemůže být více než 2 brankáři');
    }

    if (fieldPlayers.length > 13) {
      errors.push('Nemůže být více než 13 hráčů v poli');
    }

    if (coaches.length > 3) {
      errors.push('Nemůže být více než 3 trenéři');
    }

    // Warnings
    if (goalkeepers.length === 1) {
      warnings.push('Doporučujeme mít 2 brankáře pro záložní variantu');
    }

    if (fieldPlayers.length < 10) {
      warnings.push('Doporučujeme mít více hráčů pro střídání');
    }

    if (coaches.length === 0) {
      warnings.push('Doporučujeme mít alespoň 1 trenéra');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  return {
    loading,
    error,
    fetchLineup,
    saveLineup,
    deleteLineup,
    getLineupSummary,
    validateLineupData,
    searchExternalPlayers,
    getOrCreateExternalPlayer
  };
};

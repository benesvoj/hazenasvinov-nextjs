import {useState, useCallback} from 'react';

import {createClient} from '@/utils/supabase/client';
import {generateUUID} from '@/utils/uuid';

import {PlayerPosition} from '@/enums';
import {LineupFormData, LineupSummary, LineupValidation, LineupCoach, LineupPlayer} from '@/types';

const supabase = createClient();

export const useLineupData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch lineup data
  const fetchLineup = useCallback(async (matchId: string, teamId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Check if lineup exists - use .maybeSingle() instead of .single() to avoid PGRST116
      const {data: lineupData, error: lineupError} = await supabase
        .from('lineups')
        .select('*')
        .eq('match_id', matchId)
        .eq('team_id', teamId)
        .maybeSingle();

      if (lineupError) {
        console.error('Error fetching lineup:', lineupError);
        throw lineupError;
      }

      // If no lineup data found (maybeSingle returns null)
      if (!lineupData) {
        return {
          players: [],
          coaches: [],
        };
      }

      // Fetch player-manager
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
        console.warn(
          'Error fetching lineup player-manager, table might not exist yet:',
          playersError
        );
        // Return empty data instead of throwing error
        return {
          players: [],
          coaches: [],
        };
      }

      const processedPlayers = (playersData || []).map((lineupPlayer: LineupPlayer) => {
        if (lineupPlayer) {
          return {
            ...lineupPlayer,
            member_name: lineupPlayer.member?.name,
            member_surname: lineupPlayer.member?.surname,
          };
        }
        return lineupPlayer;
      });

      // Fetch coaches
      const {data: coachesData, error: coachesError} = await supabase
        .from('lineup_coaches')
        .select(
          `
          *,
          member:members(id, name, surname, registration_number)
        `
        )
        .eq('lineup_id', lineupData.id);

      if (coachesError) {
        console.warn('Error fetching lineup coaches, table might not exist yet:', coachesError);
        // Return empty data instead of throwing error
        return {
          players: [],
          coaches: [],
        };
      }

      // Process coaches data to match LineupCoachFormData format
      const processedCoaches = (coachesData || []).map((coach: LineupCoach) => ({
        ...coach,
        member_name: coach.member?.name,
        member_surname: coach.member?.surname,
        member_id: coach.member_id,
        role: coach.role,
      }));

      return {
        players: processedPlayers || [],
        coaches: processedCoaches || [],
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Chyba při načítání sestavy';
      setError(errorMessage);
      console.error('Error fetching lineup:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch lineup data by lineup ID
  const fetchLineupById = useCallback(async (lineupId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Check if lineup exists
      const {data: lineupData, error: lineupError} = await supabase
        .from('lineups')
        .select('*')
        .eq('id', lineupId)
        .single();

      if (lineupError) {
        if (lineupError.code === 'PGRST116') {
          // No lineup found
          return {
            players: [],
            coaches: [],
          };
        }
        throw lineupError;
      }

      // Fetch player-manager
      const {data: playersData, error: playersError} = await supabase
        .from('lineup_players')
        .select(
          `
          *,
          member:members(id, name, surname, registration_number)
        `
        )
        .eq('lineup_id', lineupId);

      if (playersError) {
        console.warn(
          'Error fetching lineup player-manager, table might not exist yet:',
          playersError
        );
        // Return empty data instead of throwing error
        return {
          players: [],
          coaches: [],
        };
      }

      // Process player-manager data to include display names
      const processedPlayers = (playersData || []).map((player: any) => {
        if (player.member) {
          // Internal player
          return {
            ...player,
            display_name: `${player.member.surname} ${player.member.name} (${player.member.registration_number})`,
            is_external: false,
          };
        }
        return player;
      });

      // Fetch coaches
      const {data: coachesData, error: coachesError} = await supabase
        .from('lineup_coaches')
        .select(
          `
          *,
          member:members(id, name, surname, registration_number)
        `
        )
        .eq('lineup_id', lineupId);

      if (coachesError) {
        console.warn('Error fetching lineup coaches, table might not exist yet:', coachesError);
        // Return empty data instead of throwing error
        return {
          players: [],
          coaches: [],
        };
      }

      // Process coaches data to match LineupCoachFormData format
      const processedCoaches = (coachesData || []).map((coach: any) => ({
        member_id: coach.member_id,
        role: coach.role,
      }));

      return {
        players: processedPlayers || [],
        coaches: processedCoaches || [],
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Chyba při načítání sestavy';
      setError(errorMessage);
      console.error('Error fetching lineup by ID:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete lineup
  const deleteLineup = useCallback(async (lineupId: string): Promise<void> => {
    try {
      // Delete player-manager first
      const {error: playersError} = await supabase
        .from('lineup_players')
        .delete()
        .eq('lineup_id', lineupId);

      if (playersError) {
        console.warn('Error deleting lineup player-manager:', playersError);
      }

      // Delete coaches
      const {error: coachesError} = await supabase
        .from('lineup_coaches')
        .delete()
        .eq('lineup_id', lineupId);

      if (coachesError) {
        console.warn('Error deleting lineup coaches:', coachesError);
      }

      // Delete the lineup itself
      const {error: lineupError} = await supabase.from('lineups').delete().eq('id', lineupId);

      if (lineupError) throw lineupError;
    } catch (error: any) {
      if (error.code === '42P01') {
        throw new Error(
          'Tabulka sestav ještě nebyla vytvořena. Spusťte prosím SQL skript pro vytvoření systému sestav.'
        );
      }

      // Create a more descriptive error message
      const errorMessage =
        error?.message || error?.details || error?.hint || 'Neznámá chyba při mazání sestavy';
      throw new Error(errorMessage);
    }
  }, []);

  // Save lineup
  const saveLineup = useCallback(
    async (
      lineupId: string,
      formData: LineupFormData,
      skipValidation: boolean = false
    ): Promise<void> => {
      try {
        // Client-side validation before saving (skip for automatic lineup creation)
        if (!skipValidation) {
          const validation = validateLineupData(formData);
          if (!validation.isValid) {
            const validationError = new Error(validation.errors.join(', '));
            (validationError as any).type = 'validation';
            (validationError as any).code = 'VALIDATION_ERROR';
            throw validationError;
          }
        }

        // First verify that the match exists
        const {data: matchData, error: matchError} = await supabase
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

        // Verify that the club_category_team exists - formData.team_id is actually a club_category_teams.id

        const {data: clubCategoryTeamData, error: clubCategoryTeamError} = await supabase
          .from('club_category_teams')
          .select('id, team_suffix, club_category_id')
          .eq('id', formData.team_id)
          .maybeSingle();

        if (clubCategoryTeamError) {
          console.error('Club category team not found:', clubCategoryTeamError);
          throw new Error(`Tým s ID ${formData.team_id} nebyl nalezen v databázi.`);
        }

        if (!clubCategoryTeamData) {
          throw new Error(
            `Tým s ID ${formData.team_id} nebyl nalezen v databázi. Zkontrolujte, zda jsou správně předány ID týmů.`
          );
        }

        // Use the club_category_teams.id directly (no more teams table needed)
        const teamData = {
          id: clubCategoryTeamData.id,
          club_id: clubCategoryTeamData.club_category_id,
          name: `Tým ${clubCategoryTeamData.team_suffix}`,
        };

        // Check if lineup already exists for this match/team combination
        let finalLineupId = lineupId;
        let isNewLineup = false;

        if (!finalLineupId) {
          // Look for existing lineup
          const {data: existingLineup, error: lookupError} = await supabase
            .from('lineups')
            .select('id')
            .eq('match_id', formData.match_id)
            .eq('team_id', clubCategoryTeamData.id)
            .eq('is_home_team', formData.is_home_team)
            .maybeSingle();

          if (lookupError) {
            console.error('Error looking up existing lineup:', lookupError);
            throw new Error(`Chyba při hledání existující sestavy: ${lookupError.message}`);
          }

          if (existingLineup) {
            // Use existing lineup ID
            finalLineupId = existingLineup.id;
            isNewLineup = false;
          } else {
            // Generate new UUID for new lineups
            finalLineupId = generateUUID();
            isNewLineup = true;
          }
        }

        // Delete existing lineup data only if we have a lineupId (existing lineup)
        if (lineupId) {
          await deleteLineup(lineupId);
        }

        // Always ensure the lineup record exists before inserting player-manager
        // Check if lineup exists, if not create it
        const {data: lineupExists, error: checkError} = await supabase
          .from('lineups')
          .select('id')
          .eq('id', finalLineupId)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking lineup existence:', checkError);
          throw new Error(`Chyba při kontrole sestavy: ${checkError.message}`);
        }

        if (!lineupExists) {
          // Create the lineup record
          const {error: lineupError} = await supabase.from('lineups').insert({
            id: finalLineupId,
            match_id: formData.match_id,
            team_id: clubCategoryTeamData.id, // Use the club_category_teams.id directly
            is_home_team: formData.is_home_team,
          });

          if (lineupError) {
            console.error('Error inserting lineup:', lineupError);
            throw new Error(
              `Chyba při ukládání sestavy: ${lineupError.message || lineupError.details || lineupError.hint || 'Neznámá chyba'}`
            );
          }
        }

        // Insert player-manager - use different strategies based on skipValidation
        const playersToInsert = formData.players
          .filter((player) => player.member_id) // All player-manager should have member_id now
          .map((player) => ({
            lineup_id: finalLineupId,
            member_id: player.member_id,
            position: player.position || PlayerPosition.FIELD_PLAYER,
            is_captain: player.is_captain,
            jersey_number: player.jersey_number || null,
            goals: player.goals || 0,
            yellow_cards: player.yellow_cards || 0,
            red_cards_5min: player.red_cards_5min || 0,
            red_cards_10min: player.red_cards_10min || 0,
            red_cards_personal: player.red_cards_personal || 0,
          }));

        if (playersToInsert.length > 0) {
          if (skipValidation) {
            // For automatic lineup creation, try to insert player-manager one by one to avoid constraint issues
            let insertedCount = 0;
            for (const player of playersToInsert) {
              try {
                const {error: playerError} = await supabase.from('lineup_players').insert([player]);

                if (playerError) {
                  // Log the error but continue with next player
                  console.warn(`Could not insert player ${player.member_id}:`, playerError.message);
                  // Continue with next player instead of failing completely
                } else {
                  insertedCount++;
                }
              } catch (error) {
                console.warn(`Error inserting player ${player.member_id}:`, error);
                // Continue with next player
              }
            }

            if (insertedCount === 0) {
              console.warn('No player-manager could be inserted due to validation constraints');
            }
          } else {
            // For manual saves, use the original validation logic
            const {error: playersError} = await supabase
              .from('lineup_players')
              .insert(playersToInsert);

            if (playersError) {
              console.error('Error inserting player-manager:', playersError);

              // Check if it's a validation error (lineup rules)
              if (playersError.message && playersError.message.includes('Lineup must have')) {
                throw new Error(`VALIDATION_WARNING: ${playersError.message}`);
              } else {
                throw new Error(
                  `Chyba při ukládání hráčů: ${playersError.message || playersError.details || playersError.hint || 'Neznámá chyba'}`
                );
              }
            }
          }
        }

        // Insert all coaches at once
        const coachesToInsert = formData.coaches
          .filter((coach) => coach.member_id && coach.role)
          .map((coach) => ({
            lineup_id: finalLineupId,
            member_id: coach.member_id,
            role: coach.role,
          }));

        if (coachesToInsert.length > 0) {
          const {error: coachesError} = await supabase
            .from('lineup_coaches')
            .insert(coachesToInsert);

          if (coachesError) {
            console.error('Error inserting coaches:', coachesError);
            throw new Error(
              `Chyba při ukládání trenérů: ${coachesError.message || coachesError.details || coachesError.hint || 'Neznámá chyba'}`
            );
          }
        }

        // Refresh data
        await fetchLineupById(lineupId);
      } catch (error: any) {
        if (error.code === '42P01') {
          throw new Error(
            'Tabulka sestav ještě nebyla vytvořena. Spusťte prosím SQL skript pro vytvoření systému sestav.'
          );
        }
        throw error;
      }
    },
    [deleteLineup, fetchLineupById]
  );

  // Get lineup summary
  const getLineupSummary = useCallback(
    async (matchId: string, teamId: string): Promise<LineupSummary | null> => {
      try {
        // Since we removed all database functions, use local calculation directly
        return calculateLineupSummaryFromData(matchId, teamId);
      } catch (error: any) {
        console.error('Error getting lineup summary:', error);
        return null;
      }
    },
    []
  );

  // Fallback function to calculate lineup summary from local data
  const calculateLineupSummaryFromData = async (
    matchId: string,
    teamId: string
  ): Promise<LineupSummary | null> => {
    try {
      // Get lineup data from the tables directly
      const {data: lineupData, error: lineupError} = await supabase
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
          is_valid: false,
        };
      }

      // Get player-manager count
      const {data: playersData, error: playersError} = await supabase
        .from('lineup_players')
        .select('position')
        .eq('lineup_id', lineupData.id);

      if (playersError) throw playersError;

      // Get coaches count
      const {data: coachesData, error: coachesError} = await supabase
        .from('lineup_coaches')
        .select('id')
        .eq('lineup_id', lineupData.id);

      if (coachesError) throw coachesError;

      // Calculate summary
      const goalkeepers =
        playersData?.filter((p: LineupPlayer) => p.position === 'goalkeeper').length || 0;
      const fieldPlayers =
        playersData?.filter((p: LineupPlayer) => p.position === 'field_player').length || 0;
      const coaches = coachesData?.length || 0;
      const totalPlayers = goalkeepers + fieldPlayers;

      const is_valid =
        goalkeepers >= 1 &&
        goalkeepers <= 2 &&
        fieldPlayers >= 6 &&
        fieldPlayers <= 13 &&
        coaches <= 3;

      return {
        total_players: totalPlayers + coaches,
        goalkeepers,
        field_players: fieldPlayers,
        coaches,
        is_valid,
      };
    } catch (error: any) {
      console.error('Error calculating lineup summary from data:', error);
      return null;
    }
  };

  // Validate lineup data
  const validateLineupData = (formData: LineupFormData): LineupValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Partition player-manager into valid and invalid positions in a single pass
    const {validPlayers, invalidPlayers} = formData.players.reduce(
      (acc, p) => {
        if (p.position && p.position.trim() !== '') {
          acc.validPlayers.push(p);
        } else {
          acc.invalidPlayers.push(p);
        }
        return acc;
      },
      {validPlayers: [], invalidPlayers: []} as {
        validPlayers: typeof formData.players;
        invalidPlayers: typeof formData.players;
      }
    );

    if (invalidPlayers.length > 0) {
      console.warn('⚠️ Found player-manager with invalid positions:', invalidPlayers);
    }

    const goalkeepers = validPlayers.filter((p) => p.position === 'goalkeeper');
    const fieldPlayers = validPlayers.filter((p) => p.position === 'field_player');
    const coaches = formData.coaches;

    // Minimum requirements
    if (goalkeepers.length < 1) {
      errors.push(`Musí být alespoň 1 brankář (aktuálně: ${goalkeepers.length})`);
    }

    if (fieldPlayers.length < 6) {
      errors.push(`Musí být alespoň 6 hráčů v poli (aktuálně: ${fieldPlayers.length})`);
    }

    if (goalkeepers.length + fieldPlayers.length < 7) {
      errors.push(
        `Celkem musí být alespoň 7 hráčů (aktuálně: ${goalkeepers.length + fieldPlayers.length})`
      );
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
      warnings,
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
  };
};

import { useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  LineupFormData, 
  LineupSummary, 
  LineupValidation,
  ExternalPlayer
} from '@/types/types';

// Error types for robust error handling
export enum LineupErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface LineupError {
  type: LineupErrorType;
  message: string;
  code?: string;
}

// Helper function to classify errors
export const classifyLineupError = (error: any): LineupError => {
  const message = error?.message || error?.details || error?.hint || "Neznámá chyba";
  
  // Primary classification based on error structure and codes
  if (error?.code === 'VALIDATION_ERROR' || error?.type === 'validation') {
    return {
      type: LineupErrorType.VALIDATION_ERROR,
      message,
      code: error?.code
    };
  }
  
  // Database error classification
  if (error?.code?.startsWith('23') || // PostgreSQL constraint violations
      error?.code?.startsWith('42') || // PostgreSQL syntax errors
      error?.code?.startsWith('22') || // PostgreSQL data type errors
      error?.code?.startsWith('25') || // PostgreSQL invalid transaction state
      error?.code?.startsWith('26') || // PostgreSQL invalid name
      error?.code?.startsWith('27') || // PostgreSQL triggered data change violation
      error?.code?.startsWith('28') || // PostgreSQL invalid authorization specification
      error?.code?.startsWith('2D') || // PostgreSQL invalid transaction termination
      error?.code?.startsWith('2F') || // PostgreSQL SQL routine exception
      error?.code?.startsWith('34') || // PostgreSQL invalid cursor name
      error?.code?.startsWith('38') || // PostgreSQL external routine exception
      error?.code?.startsWith('39') || // PostgreSQL external routine invocation exception
      error?.code?.startsWith('3B') || // PostgreSQL savepoint exception
      error?.code?.startsWith('40') || // PostgreSQL transaction rollback
      error?.code?.startsWith('42') || // PostgreSQL syntax error or access rule violation
      error?.code?.startsWith('44') || // PostgreSQL with check option violation
      error?.code?.startsWith('53') || // PostgreSQL insufficient resources
      error?.code?.startsWith('54') || // PostgreSQL program limit exceeded
      error?.code?.startsWith('55') || // PostgreSQL object not in prerequisite state
      error?.code?.startsWith('57') || // PostgreSQL operator intervention
      error?.code?.startsWith('58') || // PostgreSQL system error
      error?.code?.startsWith('72') || // PostgreSQL snapshot too old
      error?.code?.startsWith('F0') || // PostgreSQL configuration file error
      error?.code?.startsWith('HV') || // PostgreSQL foreign data wrapper error
      error?.code?.startsWith('P0') || // PostgreSQL PL/pgSQL error
      error?.code?.startsWith('XX') || // PostgreSQL internal error
      message.includes('duplicate key') ||
      message.includes('constraint') ||
      message.includes('violates') ||
      message.includes('foreign key') ||
      message.includes('unique constraint')) {
    return {
      type: LineupErrorType.DATABASE_ERROR,
      message,
      code: error?.code
    };
  }
  
  // Network error classification
  if (error?.name === 'NetworkError' ||
      error?.name === 'TypeError' && message.includes('fetch') ||
      error?.code === 'NETWORK_ERROR' ||
      error?.code === 'ECONNREFUSED' ||
      error?.code === 'ETIMEDOUT' ||
      error?.code === 'ENOTFOUND' ||
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('ECONNREFUSED') ||
      message.includes('ETIMEDOUT') ||
      message.includes('ENOTFOUND')) {
    return {
      type: LineupErrorType.NETWORK_ERROR,
      message,
      code: error?.code
    };
  }
  
  // Fallback: Check for validation patterns in message (less reliable but better than nothing)
  if (message.includes('Musí být alespoň') ||
      message.includes('Nemůže být více než') ||
      message.includes('Celkem musí být') ||
      message.includes('brankář') ||
      message.includes('hráč') ||
      message.includes('trenér')) {
    return {
      type: LineupErrorType.VALIDATION_ERROR,
      message,
      code: error?.code
    };
  }
  
  // Default to unknown error
  return {
    type: LineupErrorType.UNKNOWN_ERROR,
    message,
    code: error?.code
  };
};

const supabase = createClient();

export const useLineupData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // External players functionality removed - only internal players (members) are supported
  const searchExternalPlayers = useCallback(async (searchTerm: string): Promise<ExternalPlayer[]> => {
    console.warn('External players functionality is not available');
    return [];
  }, []);

  // External players functionality removed - only internal players (members) are supported
  const getOrCreateExternalPlayer = useCallback(async (
    registrationNumber: string,
    name: string,
    surname: string,
    position: string
  ): Promise<string> => {
    console.warn('External players functionality is not available');
    throw new Error('External players are not supported');
  }, []);

  // Fetch lineup data
  const fetchLineup = useCallback(async (matchId: string, teamId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Check if lineup exists - use .maybeSingle() instead of .single() to avoid PGRST116
      const { data: lineupData, error: lineupError } = await supabase
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
          coaches: []
        };
      }

      // Fetch players
      const { data: playersData, error: playersError } = await supabase
        .from('lineup_players')
        .select(`
          *,
          member:members(id, name, surname, registration_number)
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
  }, []);

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
          member:members(id, name, surname, registration_number)
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
  }, []);

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
      
      // Create a more descriptive error message
      const errorMessage = error?.message || error?.details || error?.hint || 'Neznámá chyba při mazání sestavy';
      throw new Error(errorMessage);
    }
  }, []);

  // Save lineup
  const saveLineup = useCallback(async (lineupId: string, formData: LineupFormData): Promise<void> => {
    try {
      // Client-side validation before saving
      const validation = validateLineupData(formData);
      if (!validation.isValid) {
        const validationError = new Error(validation.errors.join(', '));
        (validationError as any).type = 'validation';
        (validationError as any).code = 'VALIDATION_ERROR';
        throw validationError;
      }
      
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

      // Verify that the club_category_team exists - formData.team_id is actually a club_category_teams.id
      console.log('Looking for club_category_team with ID:', formData.team_id);
      
      const { data: clubCategoryTeamData, error: clubCategoryTeamError } = await supabase
        .from('club_category_teams')
        .select('id, team_suffix, club_category_id')
        .eq('id', formData.team_id)
        .maybeSingle();
      
      console.log('Club category team lookup result:', { clubCategoryTeamData, clubCategoryTeamError });

      if (clubCategoryTeamError) {
        console.error('Club category team not found:', clubCategoryTeamError);
        throw new Error(`Tým s ID ${formData.team_id} nebyl nalezen v databázi.`);
      }

      if (!clubCategoryTeamData) {
        console.log('Club category team not found, this should not happen if team IDs are correct');
        throw new Error(`Tým s ID ${formData.team_id} nebyl nalezen v databázi. Zkontrolujte, zda jsou správně předány ID týmů.`);
      }

      // Use the club_category_teams.id directly (no more teams table needed)
      const teamData = {
        id: clubCategoryTeamData.id,
        club_id: clubCategoryTeamData.club_category_id,
        name: `Tým ${clubCategoryTeamData.team_suffix}`
      };

      console.log('Match and team verified, proceeding with lineup save:', { match: matchData, team: teamData });

      // Delete existing lineup data
      await deleteLineup(lineupId);

      // Insert new lineup using the club_category_teams.id directly
      const { error: lineupError } = await supabase
        .from('lineups')
        .insert({
          id: lineupId,
          match_id: formData.match_id,
          team_id: clubCategoryTeamData.id, // Use the club_category_teams.id directly
          is_home_team: formData.is_home_team
        });

      if (lineupError) {
        console.error('Error inserting lineup:', lineupError);
        throw new Error(`Chyba při ukládání sestavy: ${lineupError.message || lineupError.details || lineupError.hint || 'Neznámá chyba'}`);
      }

      // Debug: Log the players being inserted
      console.log('Players to be inserted:', formData.players.map(p => ({
        member_id: p.member_id,
        position: p.position,
        role: p.role,
        is_goalkeeper: p.position === 'goalkeeper'
      })));
      
      const goalkeepers = formData.players.filter(p => p.position === 'goalkeeper');
      const fieldPlayers = formData.players.filter(p => p.position === 'field_player');
      console.log('Goalkeepers count:', goalkeepers.length);
      console.log('Field players count:', fieldPlayers.length);

      // Insert all players at once to avoid validation trigger issues
      const playersToInsert = formData.players
        .filter(player => player.member_id)
        .map(player => ({
          lineup_id: lineupId,
          member_id: player.member_id,
          position: player.position || 'field_player',
          is_captain: player.role === 'captain',
          jersey_number: player.jersey_number || null,
          goals: player.goals || 0,
          yellow_cards: player.yellow_cards || 0,
          red_cards_5min: player.red_cards_5min || 0,
          red_cards_10min: player.red_cards_10min || 0,
          red_cards_personal: player.red_cards_personal || 0
        }));

      if (playersToInsert.length > 0) {
        console.log('Inserting all players at once:', playersToInsert);
        
        const { error: playersError } = await supabase
          .from('lineup_players')
          .insert(playersToInsert);

        if (playersError) {
          console.error('Error inserting players:', playersError);
          
          // Check if it's a validation error (lineup rules)
          if (playersError.message && playersError.message.includes('Lineup must have')) {
            throw new Error(`VALIDATION_WARNING: ${playersError.message}`);
          }
          
          throw new Error(`Chyba při ukládání hráčů: ${playersError.message || playersError.details || playersError.hint || 'Neznámá chyba'}`);
        }
      }

      // Handle external players (not supported in current schema)
      const externalPlayers = formData.players.filter(player => 
        !player.member_id && player.external_name && player.external_surname && player.external_registration_number
      );
      
      if (externalPlayers.length > 0) {
        console.warn('External players not supported in current schema, skipping:', externalPlayers);
      }

      // Insert all coaches at once
      const coachesToInsert = formData.coaches
        .filter(coach => coach.member_id && coach.role)
        .map(coach => ({
          lineup_id: lineupId,
          member_id: coach.member_id,
          role: coach.role
        }));

      if (coachesToInsert.length > 0) {
        console.log('Inserting all coaches at once:', coachesToInsert);
        
        const { error: coachesError } = await supabase
          .from('lineup_coaches')
          .insert(coachesToInsert);

        if (coachesError) {
          console.error('Error inserting coaches:', coachesError);
          throw new Error(`Chyba při ukládání trenérů: ${coachesError.message || coachesError.details || coachesError.hint || 'Neznámá chyba'}`);
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
  }, [deleteLineup, fetchLineupById]);

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
  }, []);

  // Fallback function to calculate lineup summary from local data
  const calculateLineupSummaryFromData = async (matchId: string, teamId: string): Promise<LineupSummary | null> => {
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
  };

  // Validate lineup data
  const validateLineupData = (formData: LineupFormData): LineupValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Debug: Log all players and their positions
    console.log('🔍 Validating lineup data:', {
      totalPlayers: formData.players.length,
      players: formData.players.map(p => ({ 
        name: p.display_name || `${p.external_name} ${p.external_surname}`,
        position: p.position,
        isExternal: p.is_external
      }))
    });

    // Filter out players with invalid positions
    const validPlayers = formData.players.filter(p => p.position && p.position.trim() !== '');
    const invalidPlayers = formData.players.filter(p => !p.position || p.position.trim() === '');
    
    if (invalidPlayers.length > 0) {
      console.warn('⚠️ Found players with invalid positions:', invalidPlayers);
    }

    const goalkeepers = validPlayers.filter(p => p.position === 'goalkeeper');
    const fieldPlayers = validPlayers.filter(p => p.position === 'field_player');
    const coaches = formData.coaches;

    console.log('🔍 Position filtering results:', {
      goalkeepers: goalkeepers.length,
      fieldPlayers: fieldPlayers.length,
      validPlayers: validPlayers.length,
      totalPlayers: formData.players.length,
      invalidPlayers: invalidPlayers.length
    });

    // Minimum requirements
    if (goalkeepers.length < 1) {
      errors.push(`Musí být alespoň 1 brankář (aktuálně: ${goalkeepers.length})`);
    }

    if (fieldPlayers.length < 6) {
      errors.push(`Musí být alespoň 6 hráčů v poli (aktuálně: ${fieldPlayers.length})`);
    }

    if (goalkeepers.length + fieldPlayers.length < 7) {
      errors.push(`Celkem musí být alespoň 7 hráčů (aktuálně: ${goalkeepers.length + fieldPlayers.length})`);
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

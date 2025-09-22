import {useState, useCallback} from 'react';
import {createClient} from '@/utils/supabase/client';
import {UnifiedPlayer, PlayerSearchFilters, PlayerSearchResult} from '@/types/unifiedPlayer';

const supabase = createClient();

export function useUnifiedPlayers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search players with filters
  const searchPlayers = useCallback(
    async (filters: PlayerSearchFilters = {}): Promise<PlayerSearchResult[]> => {
      try {
        setLoading(true);
        setError(null);

        // Build query based on filters
        let query = supabase.from('members').select(`
            id,
            name,
            surname,
            registration_number,
            category_id,
            functions
          `);

        // Apply search term filter
        if (filters.search_term) {
          const searchTerm = filters.search_term.toLowerCase();
          query = query.or(
            `name.ilike.%${searchTerm}%,surname.ilike.%${searchTerm}%,registration_number.ilike.%${searchTerm}%`
          );
        }

        // Apply club filter (if club_id is provided, show only internal players)
        if (filters.club_id) {
          // For internal players, we don't need additional filtering by club_id
          // as members table already contains our club's players
        }

        // Apply category filter
        if (filters.category_id) {
          query = query.eq('category_id', filters.category_id);
        }

        // Filter to show only players (members with 'player' function)
        query = query.contains('functions', ['player']);

        // Apply external filter
        if (filters.is_external !== undefined) {
          // For now, we'll treat all members as internal players
          // External players would need a different approach
          if (filters.is_external) {
            // Return empty array for external players for now
            return [];
          }
        }

        // Note: Position filter is not applicable here as position is a lineup attribute, not a member attribute

        // Note: is_active filter is not applicable as this column doesn't exist in members table

        const {data, error: searchError} = await query.order('surname');

        if (searchError) {
          console.error('Error searching players:', searchError);
          throw searchError;
        }

        // Transform results to include display_name and other required fields
        const results: PlayerSearchResult[] = (data || []).map((player: any) => ({
          id: player.id,
          name: player.name,
          surname: player.surname,
          registration_number: player.registration_number,
          position: undefined, // Position is set when adding to lineup, not a member attribute
          jersey_number: undefined, // Jersey number is set when adding to lineup, not a member attribute
          is_external: false, // All members are internal
          is_active: true, // Assume all members are active since is_active column doesn't exist
          current_club_name: 'TJ Sokol Svinov', // Default club name
          display_name: `${player.surname} ${player.name} (${player.registration_number})`,
        }));

        // Sort results by surname (position sorting will be handled in the lineup display)
        results.sort((a, b) => a.surname.localeCompare(b.surname));

        return results;
      } catch (err) {
        console.error('Error in searchPlayers:', err);
        setError(err instanceof Error ? err.message : 'Failed to search players');
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get player by ID with full details
  const getPlayerById = useCallback(async (playerId: string): Promise<UnifiedPlayer | null> => {
    try {
      setLoading(true);
      setError(null);

      const {data, error: fetchError} = await supabase
        .from('unified_players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (fetchError) {
        console.error('Error fetching player:', fetchError);
        throw fetchError;
      }

      return data;
    } catch (err) {
      console.error('Error in getPlayerById:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch player');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get players by club
  const getPlayersByClub = useCallback(async (clubId: string): Promise<UnifiedPlayer[]> => {
    try {
      setLoading(true);
      setError(null);

      const {data, error: fetchError} = await supabase
        .from('unified_players')
        .select('*')
        .eq('current_club_id', clubId)
        .eq('is_active', true)
        .order('name');

      if (fetchError) {
        console.error('Error fetching club players:', fetchError);
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      console.error('Error in getPlayersByClub:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch club players');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create or update player
  const savePlayer = useCallback(
    async (playerData: Partial<UnifiedPlayer>): Promise<UnifiedPlayer | null> => {
      try {
        setLoading(true);
        setError(null);

        const {data, error: saveError} = await supabase
          .from('members')
          .upsert(playerData, {onConflict: 'id'})
          .select()
          .single();

        if (saveError) {
          console.error('Error saving player:', saveError);
          throw saveError;
        }

        return data;
      } catch (err) {
        console.error('Error in savePlayer:', err);
        setError(err instanceof Error ? err.message : 'Failed to save player');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get external players (players from other clubs)
  const getExternalPlayers = useCallback(async (): Promise<UnifiedPlayer[]> => {
    try {
      setLoading(true);
      setError(null);

      const {data, error: fetchError} = await supabase
        .from('unified_players')
        .select('*')
        .eq('is_external', true)
        .eq('is_active', true)
        .order('name');

      if (fetchError) {
        console.error('Error fetching external players:', fetchError);
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      console.error('Error in getExternalPlayers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch external players');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get internal players (players from our club)
  const getInternalPlayers = useCallback(async (): Promise<UnifiedPlayer[]> => {
    try {
      setLoading(true);
      setError(null);

      const {data, error: fetchError} = await supabase
        .from('unified_players')
        .select('*')
        .eq('is_external', false)
        .eq('is_active', true)
        .order('name');

      if (fetchError) {
        console.error('Error fetching internal players:', fetchError);
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      console.error('Error in getInternalPlayers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch internal players');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    searchPlayers,
    getPlayerById,
    getPlayersByClub,
    savePlayer,
    getExternalPlayers,
    getInternalPlayers,
  };
}

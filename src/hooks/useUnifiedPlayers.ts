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

        const {data, error: searchError} = await supabase.rpc('search_players', {
          search_term: filters.search_term || '',
          club_id: filters.club_id || null,
          is_external_filter: filters.is_external || null,
          position_filter: filters.position || null,
        });

        if (searchError) {
          console.error('Error searching players:', searchError);
          throw searchError;
        }

        // Transform results to include display_name
        const results: PlayerSearchResult[] = (data || []).map((player: any) => ({
          ...player,
          display_name: `${player.name} ${player.surname} (${player.registration_number})`,
        }));

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

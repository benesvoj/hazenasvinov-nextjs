import {useState, useCallback} from 'react';

import {
  UnifiedPlayer,
  PlayerSearchFilters,
  PlayerSearchResult,
} from '@/types/entities/member/data/unifiedPlayer';

import {createClient} from '@/utils/supabase/client';

import {getClubName} from '@/constants';

const supabase = createClient();

export function useUnifiedPlayers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search player-manager with filters
  const searchPlayers = useCallback(
    async (filters: PlayerSearchFilters = {}): Promise<PlayerSearchResult[]> => {
      try {
        setLoading(true);
        setError(null);

        // Build query with member_club_relationships join to determine internal vs external
        let query = supabase.from('members').select(`
            id,
            name,
            surname,
            registration_number,
            category_id,
            functions,
            member_club_relationships!inner(
              club_id,
              clubs!inner(
                id,
                name
              )
            )
          `);

        // Apply search term filter
        if (filters.search_term) {
          const searchTerm = filters.search_term.toLowerCase();
          query = query.or(
            `name.ilike.%${searchTerm}%,surname.ilike.%${searchTerm}%,registration_number.ilike.%${searchTerm}%`
          );
        }

        // Apply club filter
        if (filters.club_id) {
          query = query.eq('member_club_relationships.club_id', filters.club_id);
        }

        // Apply category filter
        if (filters.category_id) {
          query = query.eq('category_id', filters.category_id);
        }

        // Filter to show only player-manager (members with 'player' function)
        query = query.contains('functions', ['player']);

        // Apply external filter based on club relationship
        if (filters.is_external !== undefined) {
          if (filters.is_external) {
            // For external player-manager, exclude our club (assuming club_id filter is our club)
            // This would need to be implemented based on your club ID
            // For now, we'll show all player-manager and filter in the transformation
          } else {
            // For internal player-manager, only show our club members
            // This would need to be implemented based on your club ID
          }
        }

        const {data, error: searchError} = await query.order('surname');

        if (searchError) {
          console.error('Error searching player-manager:', searchError);
          throw searchError;
        }

        // TODO: remove any type
        // Transform results to include display_name and determine internal vs external
        const results: PlayerSearchResult[] = (data || []).map((player: any) => {
          const clubRelationship = player.member_club_relationships?.[0];
          // Player is external if they don't have a relationship with the filtered club
          const isExternal = clubRelationship?.club_id !== filters.club_id;
          const isActive = clubRelationship?.status === 'active';

          return {
            id: player.id,
            name: player.name,
            surname: player.surname,
            registration_number: player.registration_number,
            position: undefined, // Position is set when adding to lineup, not a member attribute
            jersey_number: undefined, // Jersey number is set when adding to lineup, not a member attribute
            is_external: isExternal,
            is_active: isActive, // Use status from member_club_relationships
            current_club_name: clubRelationship?.clubs?.name || 'Neznámý klub',
            display_name: `${player.surname} ${player.name} (${player.registration_number})`,
          };
        });

        // Sort results by surname (position sorting will be handled in the lineup display)
        results.sort((a, b) => a.surname.localeCompare(b.surname));

        return results;
      } catch (err) {
        console.error('Error in searchPlayers:', err);
        setError(err instanceof Error ? err.message : 'Failed to search player-manager');
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
        .from('members')
        .select(
          `
          id,
          name,
          surname,
          registration_number,
          category_id,
          functions,
          date_of_birth,
          sex,
          created_at,
          updated_at
        `
        )
        .eq('id', playerId)
        .single();

      if (fetchError) {
        console.error('Error fetching player:', fetchError);
        throw fetchError;
      }

      if (!data) return null;

      // Transform member data to UnifiedPlayer format
      const unifiedPlayer: UnifiedPlayer = {
        id: data.id,
        name: data.name,
        surname: data.surname,
        registration_number: data.registration_number,
        category_id: data.category_id,
        functions: data.functions,
        date_of_birth: data.date_of_birth,
        sex: data.sex,
        is_external: false, // This will be determined by club relationship
        is_active: true, // This will be determined by club relationship status
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        current_club_name: getClubName(), // Get club name from configuration
      };

      return unifiedPlayer;
    } catch (err) {
      console.error('Error in getPlayerById:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch player');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get player-manager by club using member_club_relationships
  const getPlayersByClub = useCallback(async (clubId: string): Promise<UnifiedPlayer[]> => {
    try {
      setLoading(true);
      setError(null);

      const {data, error: fetchError} = await supabase
        .from('member_club_relationships')
        .select(
          `
          member_id,
          members!inner(
            id,
            name,
            surname,
            registration_number,
            category_id,
            functions,
            date_of_birth,
            sex,
            created_at,
            updated_at
          )
        `
        )
        .eq('club_id', clubId)
        .eq('status', 'active')
        .lte('valid_from', new Date().toISOString().split('T')[0])
        .or('valid_to.is.null,valid_to.gte.' + new Date().toISOString().split('T')[0])
        .order('members(surname)');

      if (fetchError) {
        console.error('Error fetching club player-manager:', fetchError);
        throw fetchError;
      }

      // Transform results to UnifiedPlayer format
      const players: UnifiedPlayer[] = (data || []).map((relationship: any) => {
        const member = relationship.members;
        return {
          id: member.id,
          name: member.name,
          surname: member.surname,
          registration_number: member.registration_number,
          category_id: member.category_id,
          functions: member.functions,
          date_of_birth: member.date_of_birth,
          sex: member.sex,
          is_external: false, // This will be determined by club relationship
          is_active: true, // This will be determined by club relationship status
          created_at: member.created_at,
          updated_at: member.updated_at,
          current_club_name: getClubName(), // Get club name from configuration
        };
      });

      return players;
    } catch (err) {
      console.error('Error in getPlayersByClub:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch club player-manager');
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

  // Get external player-manager (player-manager from other clubs)
  // Note: External player-manager are typically created on-the-fly in lineups
  // This function returns empty array as external player-manager don't exist in members table
  const getExternalPlayers = useCallback(async (): Promise<UnifiedPlayer[]> => {
    try {
      setLoading(true);
      setError(null);

      // External player-manager are created dynamically in lineups, not stored in members table
      // Return empty array as external player-manager are handled differently
      return [];
    } catch (err) {
      console.error('Error in getExternalPlayers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch external player-manager');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get internal player-manager (player-manager from our club)
  const getInternalPlayers = useCallback(async (): Promise<UnifiedPlayer[]> => {
    try {
      setLoading(true);
      setError(null);

      const {data, error: fetchError} = await supabase
        .from('members')
        .select(
          `
          id,
          name,
          surname,
          registration_number,
          category_id,
          functions,
          date_of_birth,
          sex,
          created_at,
          updated_at
        `
        )
        .contains('functions', ['player'])
        .order('surname');

      if (fetchError) {
        console.error('Error fetching internal player-manager:', fetchError);
        throw fetchError;
      }

      // Transform results to UnifiedPlayer format
      const players: UnifiedPlayer[] = (data || []).map((member: any) => ({
        id: member.id,
        name: member.name,
        surname: member.surname,
        registration_number: member.registration_number,
        category_id: member.category_id,
        functions: member.functions,
        date_of_birth: member.date_of_birth,
        sex: member.sex,
        is_external: false, // This will be determined by club relationship
        is_active: true, // This will be determined by club relationship status
        created_at: member.created_at,
        updated_at: member.updated_at,
        current_club_name: getClubName(), // Get club name from configuration
      }));

      return players;
    } catch (err) {
      console.error('Error in getInternalPlayers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch internal player-manager');
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

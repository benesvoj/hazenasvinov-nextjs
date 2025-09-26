import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {createClient} from '@/utils/supabase/client';
import {
  MatchMetadata,
  CreateMatchMetadataRequest,
  UpdateMatchMetadataRequest,
  MetadataType,
} from '@/types';

const supabase = createClient();

// Query keys
export const matchMetadataKeys = {
  all: ['matchMetadata'] as const,
  byMatch: (matchId: string) => [...matchMetadataKeys.all, 'match', matchId] as const,
  byMatchAndType: (matchId: string, type: MetadataType) =>
    [...matchMetadataKeys.byMatch(matchId), 'type', type] as const,
};

// Fetch metadata for a match
export function useMatchMetadata(matchId: string, type?: MetadataType) {
  return useQuery({
    queryKey: type
      ? matchMetadataKeys.byMatchAndType(matchId, type)
      : matchMetadataKeys.byMatch(matchId),
    queryFn: async () => {
      let query = supabase
        .from('match_metadata')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', {ascending: false});

      if (type) {
        query = query.eq('metadata_type', type);
      }

      const {data, error} = await query;

      if (error) {
        throw new Error(`Failed to fetch match metadata: ${error.message}`);
      }

      return data as MatchMetadata[];
    },
    enabled: !!matchId,
  });
}

// Fetch primary metadata of a specific type
export function usePrimaryMatchMetadata(matchId: string, type: MetadataType) {
  return useQuery({
    queryKey: [...matchMetadataKeys.byMatchAndType(matchId, type), 'primary'],
    queryFn: async () => {
      const {data, error} = await supabase
        .from('match_metadata')
        .select('*')
        .eq('match_id', matchId)
        .eq('metadata_type', type)
        .eq('is_primary', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch primary ${type} metadata: ${error.message}`);
      }

      return data as MatchMetadata | null;
    },
    enabled: !!matchId,
  });
}

// Add new metadata
export function useAddMatchMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMatchMetadataRequest) => {
      const {data: result, error} = await supabase
        .from('match_metadata')
        .insert(data)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add metadata: ${error.message}`);
      }

      return result as MatchMetadata;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: matchMetadataKeys.byMatch(data.match_id),
      });
      queryClient.invalidateQueries({
        queryKey: matchMetadataKeys.byMatchAndType(data.match_id, data.metadata_type),
      });
    },
  });
}

// Update existing metadata
export function useUpdateMatchMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({id, ...data}: UpdateMatchMetadataRequest) => {
      const {data: result, error} = await supabase
        .from('match_metadata')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update metadata: ${error.message}`);
      }

      return result as MatchMetadata;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: matchMetadataKeys.byMatch(data.match_id),
      });
      queryClient.invalidateQueries({
        queryKey: matchMetadataKeys.byMatchAndType(data.match_id, data.metadata_type),
      });
    },
  });
}

// Delete metadata
export function useDeleteMatchMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First get the metadata to know which queries to invalidate
      const {data: metadata} = await supabase
        .from('match_metadata')
        .select('match_id, metadata_type')
        .eq('id', id)
        .single();

      const {error} = await supabase.from('match_metadata').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete metadata: ${error.message}`);
      }

      return {id, metadata};
    },
    onSuccess: (data) => {
      if (data.metadata) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({
          queryKey: matchMetadataKeys.byMatch(data.metadata.match_id),
        });
        queryClient.invalidateQueries({
          queryKey: matchMetadataKeys.byMatchAndType(
            data.metadata.match_id,
            data.metadata.metadata_type
          ),
        });
      }
    },
  });
}

// Set primary metadata (unset others of same type)
export function useSetPrimaryMatchMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({id, matchId, type}: {id: string; matchId: string; type: MetadataType}) => {
      // First unset all primary flags for this match and type
      await supabase
        .from('match_metadata')
        .update({is_primary: false})
        .eq('match_id', matchId)
        .eq('metadata_type', type);

      // Then set the selected one as primary
      const {data, error} = await supabase
        .from('match_metadata')
        .update({is_primary: true})
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to set primary metadata: ${error.message}`);
      }

      return data as MatchMetadata;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: matchMetadataKeys.byMatch(data.match_id),
      });
      queryClient.invalidateQueries({
        queryKey: matchMetadataKeys.byMatchAndType(data.match_id, data.metadata_type),
      });
    },
  });
}

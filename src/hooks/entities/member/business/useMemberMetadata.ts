'use client';
import {useState, useCallback} from 'react';

import {MemberMetadata, MemberWithMetadata} from '@/types/entities/member/data/memberMetadata';

import {createClient} from '@/utils/supabase/client';

export function useMemberMetadata() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Get member metadata by member ID
  const getMemberMetadata = useCallback(
    async (memberId: string): Promise<MemberMetadata | null> => {
      try {
        setLoading(true);
        setError(null);

        const {data, error} = await supabase
          .from('member_metadata')
          .select('*')
          .eq('member_id', memberId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No metadata found, return null
            return null;
          }
          throw error;
        }

        return data;
      } catch (err) {
        console.error('Error fetching member metadata:', err);
        setError(err instanceof Error ? err.message : 'Chyba při načítání metadat člena');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Get member with metadata
  const getMemberWithMetadata = useCallback(
    async (memberId: string): Promise<MemberWithMetadata | null> => {
      try {
        setLoading(true);
        setError(null);

        const {data, error} = await supabase
          .from('members_with_metadata')
          .select('*')
          .eq('id', memberId)
          .single();

        if (error) throw error;

        return data;
      } catch (err) {
        console.error('Error fetching member with metadata:', err);
        setError(err instanceof Error ? err.message : 'Chyba při načítání člena s metadaty');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Update member metadata
  const updateMemberMetadata = useCallback(
    async (memberId: string, metadata: Partial<MemberMetadata>): Promise<MemberMetadata | null> => {
      try {
        setLoading(true);
        setError(null);

        const {data, error} = await supabase
          .from('member_metadata')
          .upsert({
            member_id: memberId,
            ...metadata,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        return data;
      } catch (err) {
        console.error('Error updating member metadata:', err);
        setError(err instanceof Error ? err.message : 'Chyba při aktualizaci metadat člena');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Create member metadata
  const createMemberMetadata = useCallback(
    async (memberId: string, metadata: Partial<MemberMetadata>): Promise<MemberMetadata | null> => {
      try {
        setLoading(true);
        setError(null);

        const {data, error} = await supabase
          .from('member_metadata')
          .insert({
            member_id: memberId,
            ...metadata,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        return data;
      } catch (err) {
        console.error('Error creating member metadata:', err);
        setError(err instanceof Error ? err.message : 'Chyba při vytváření metadat člena');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Delete member metadata
  const deleteMemberMetadata = useCallback(
    async (memberId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const {error} = await supabase.from('member_metadata').delete().eq('member_id', memberId);

        if (error) throw error;

        return true;
      } catch (err) {
        console.error('Error deleting member metadata:', err);
        setError(err instanceof Error ? err.message : 'Chyba při mazání metadat člena');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  return {
    loading,
    error,
    setError,
    getMemberMetadata,
    getMemberWithMetadata,
    updateMemberMetadata,
    createMemberMetadata,
    deleteMemberMetadata,
  };
}

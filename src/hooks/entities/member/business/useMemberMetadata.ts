'use client';

import {useCallback, useState} from 'react';

import {useSupabaseClient} from '@/hooks';
import {MemberMetadata, MemberWithMetadata} from '@/types';

export function useMemberMetadata() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabaseClient();

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

        const {data: existing} = await supabase
          .from('member_metadata')
          .select('id')
          .eq('member_id', memberId)
          .maybeSingle();

        const now = new Date().toISOString();
        const payload = {member_id: memberId, ...metadata, updated_at: now};

        const {data, error} = existing
          ? await supabase
              .from('member_metadata')
              .update(payload)
              .eq('member_id', memberId)
              .select()
              .single()
          : await supabase
              .from('member_metadata')
              .insert({...payload, created_at: now})
              .select()
              .single();

        if (error) {
          console.error(
            'Error updating member metadata:',
            error.message,
            error.code,
            error.details
          );
          throw error;
        }

        return data;
      } catch (err) {
        const msg = (err as any)?.message ?? 'Chyba při aktualizaci metadat člena';
        setError(msg);
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

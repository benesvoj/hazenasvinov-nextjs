import {useState, useCallback} from 'react';
import {createClient} from '@/utils/supabase/client';
import {showToast} from '@/components';
import {RelationshipType, RelationshipStatus} from '@/enums';

export interface CreateMemberClubRelationshipData {
  memberId: string;
  clubId: string;
  relationshipType?: RelationshipType;
  status?: RelationshipStatus;
  validFrom?: string;
  validTo?: string;
  notes?: string;
}

export interface UpdateMemberClubRelationshipData {
  relationshipId: string;
  relationshipType?: RelationshipType;
  status?: RelationshipStatus;
  validFrom?: string;
  validTo?: string;
  notes?: string;
}

/**
 * Hook for managing member-club relationships
 * Provides reusable functions for relationship management
 */
export function useMemberClubRelationships() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  /**
   * Create a member-club relationship
   */
  const createRelationship = useCallback(
    async (data: CreateMemberClubRelationshipData): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const {error: relationshipError} = await supabase.from('member_club_relationships').insert({
          member_id: data.memberId,
          club_id: data.clubId,
          relationship_type: data.relationshipType || RelationshipType.PERMANENT,
          status: data.status || RelationshipStatus.ACTIVE,
          valid_from: data.validFrom || new Date().toISOString().split('T')[0],
          valid_to: data.validTo || null,
          notes: data.notes || null,
        });

        if (relationshipError) {
          console.error('Error creating member-club relationship:', relationshipError);
          throw new Error(`Chyba při vytváření vztahu člen-klub: ${relationshipError.message}`);
        }

        showToast.success('Vztah člen-klub byl úspěšně vytvořen');
      } catch (error) {
        console.error('Error creating member-club relationship:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Chyba při vytváření vztahu člen-klub';
        showToast.danger(errorMessage);
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Update a member-club relationship
   */
  const updateRelationship = useCallback(
    async (data: UpdateMemberClubRelationshipData): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        if (data.relationshipType !== undefined)
          updateData.relationship_type = data.relationshipType;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.validFrom !== undefined) updateData.valid_from = data.validFrom;
        if (data.validTo !== undefined) updateData.valid_to = data.validTo;
        if (data.notes !== undefined) updateData.notes = data.notes;

        const {error: relationshipError} = await supabase
          .from('member_club_relationships')
          .update(updateData)
          .eq('id', data.relationshipId);

        if (relationshipError) {
          console.error('Error updating member-club relationship:', relationshipError);
          throw new Error(`Chyba při aktualizaci vztahu člen-klub: ${relationshipError.message}`);
        }

        showToast.success('Vztah člen-klub byl úspěšně aktualizován');
      } catch (error) {
        console.error('Error updating member-club relationship:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Chyba při aktualizaci vztahu člen-klub';
        showToast.danger(errorMessage);
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Delete a member-club relationship
   */
  const deleteRelationship = useCallback(
    async (relationshipId: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const {error: relationshipError} = await supabase
          .from('member_club_relationships')
          .delete()
          .eq('id', relationshipId);

        if (relationshipError) {
          console.error('Error deleting member-club relationship:', relationshipError);
          throw new Error(`Chyba při mazání vztahu člen-klub: ${relationshipError.message}`);
        }

        showToast.success('Vztah člen-klub byl úspěšně smazán');
      } catch (error) {
        console.error('Error deleting member-club relationship:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Chyba při mazání vztahu člen-klub';
        showToast.danger(errorMessage);
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Get member-club relationships for a specific member
   */
  const getMemberRelationships = useCallback(
    async (memberId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const {data, error: relationshipError} = await supabase
          .from('member_club_relationships')
          .select(
            `
            *,
            club:clubs(
              id,
              name,
              short_name
            )
          `
          )
          .eq('member_id', memberId)
          .order('created_at', {ascending: false});

        if (relationshipError) {
          console.error('Error fetching member relationships:', relationshipError);
          throw new Error(`Chyba při načítání vztahů člena: ${relationshipError.message}`);
        }

        return data || [];
      } catch (error) {
        console.error('Error fetching member relationships:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Chyba při načítání vztahů člena';
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Get member-club relationships for a specific club
   */
  const getClubRelationships = useCallback(
    async (clubId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const {data, error: relationshipError} = await supabase
          .from('member_club_relationships')
          .select(
            `
            *,
            member:members(
              id,
              name,
              surname,
              registration_number
            )
          `
          )
          .eq('club_id', clubId)
          .order('created_at', {ascending: false});

        if (relationshipError) {
          console.error('Error fetching club relationships:', relationshipError);
          throw new Error(`Chyba při načítání vztahů klubu: ${relationshipError.message}`);
        }

        return data || [];
      } catch (error) {
        console.error('Error fetching club relationships:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Chyba při načítání vztahů klubu';
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  return {
    isLoading,
    error,
    createRelationship,
    updateRelationship,
    deleteRelationship,
    getMemberRelationships,
    getClubRelationships,
  };
}

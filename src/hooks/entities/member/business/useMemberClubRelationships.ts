'use client';

import {useCallback, useState} from 'react';

import {showToast} from '@/components';
import {API_ROUTES, translations} from '@/lib';
import {CreateMemberClubRelationshipData, UpdateMemberClubRelationshipData} from '@/types';

/**
 * Hook for managing member-club relationships
 * Provides reusable functions for relationship management
 */
export function useMemberClubRelationships() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = translations.memberClubRelationship;

  /**
   * Create a member-club relationship via API
   */
  const createRelationship = useCallback(
    async (data: CreateMemberClubRelationshipData): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(API_ROUTES.members.relationships(data.memberId), {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            clubId: data.clubId,
            relationshipType: data.relationshipType,
            status: data.status,
            validFrom: data.validFrom,
            validTo: data.validTo,
            notes: data.notes,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || t.responseMessages.relationshipCreationError);
        }

        showToast.success(t.responseMessages.relationshipCreationSuccess);
      } catch (error) {
        console.error('Error creating member-club relationship:', error);
        const errorMessage =
          error instanceof Error ? error.message : t.responseMessages.relationshipCreationError;
        showToast.danger(errorMessage);
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );
  /**
   * Update a member-club relationship via API
   */
  const updateRelationship = useCallback(
    async (data: UpdateMemberClubRelationshipData): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(API_ROUTES.relationships.byId(data.relationshipId), {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || t.responseMessages.relationshipUpdateError);
        }

        showToast.success(t.responseMessages.relationshipUpdateSuccess);
      } catch (error) {
        console.error('Error updating member-club relationship:', error);
        const errorMessage =
          error instanceof Error ? error.message : t.responseMessages.relationshipUpdateError;
        showToast.danger(errorMessage);
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Delete a member-club relationship via API
   */
  const deleteRelationship = useCallback(async (relationshipId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ROUTES.relationships.byId(relationshipId), {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t.responseMessages.relationshipDeleteError);
      }

      showToast.success(t.responseMessages.relationshipDeleteSuccess);
    } catch (error) {
      console.error('Error deleting member-club relationship:', error);
      const errorMessage =
        error instanceof Error ? error.message : t.responseMessages.relationshipDeleteError;
      showToast.danger(errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get member-club relationships for a specific member via API
   */
  const getMemberRelationships = useCallback(async (memberId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ROUTES.members.relationships(memberId));
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t.responseMessages.relationshipFetchError);
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching member relationships:', error);
      const errorMessage =
        error instanceof Error ? error.message : t.responseMessages.relationshipFetchError;
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get member-club relationships for a specific club via API
   * Note: This requires a /api/clubs/[id]/relationships route to be created
   */
  const getClubRelationships = useCallback(async (clubId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/clubs/${clubId}/relationships`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t.responseMessages.relationshipFetchError);
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching club relationships:', error);
      const errorMessage =
        error instanceof Error ? error.message : t.responseMessages.relationshipFetchError;
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

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

'use client';

import {useCallback, useState} from 'react';

import {showToast} from '@/components';
import {API_ROUTES} from '@/lib';
import {CreateCategoryLineupMemberModal, UpdateCategoryLineupMember} from '@/types';

/**
 * Hook for managing category lineup member data and CRUD operations
 * Handles: fetching, creating, updating, deleting
 */
export const useCategoryLineupMember = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create lineup member (adding relation between lineup and member)
  const createLineupMember = useCallback(
    async (categoryId: string, lineupId: string, data: CreateCategoryLineupMemberModal) => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(API_ROUTES.categories.lineupByIdMembers(categoryId, lineupId), {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data),
        });
        const response = await res.json();

        if (!res.ok || response.error) {
          throw new Error(response.error || 'Failed to add lineup member');
        }

        showToast.success('Lineup member added successfully');
        return response;
      } catch (error) {
        console.error('Error adding lineup member:', error);
        showToast.danger('Failed to add lineup member');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateLineupMember = useCallback(
    async (
      categoryId: string,
      lineupId: string,
      memberId: string,
      data: UpdateCategoryLineupMember
    ) => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          API_ROUTES.categories.lineupByIdMemberById(categoryId, lineupId, memberId),
          {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data),
          }
        );
        const response = await res.json();

        if (!res.ok || response.error) {
          throw new Error(response.error || 'Failed to update lineup member');
        }

        showToast.success('Lineup member updated successfully');
        return response;
      } catch (error) {
        console.error('Error updating lineup member:', error);
        showToast.danger('Failed to update lineup member');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const removeLineupMember = useCallback(
    async (categoryId: string, lineupId: string, memberId: string) => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          API_ROUTES.categories.lineupByIdMemberById(categoryId, lineupId, memberId),
          {
            method: 'DELETE',
          }
        );
        if (!res.ok) throw new Error('Failed to remove lineup member');

        showToast.success('Lineup member removed successfully');
      } catch (error) {
        console.error('Error removing lineup member:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    createLineupMember,
    updateLineupMember,
    removeLineupMember,
    loading,
    error,
  };
};

'use client';

import {useCallback, useEffect, useState} from 'react';

import {showToast} from '@/components';
import {API_ROUTES, translations} from '@/lib';
import {Committee, CommitteeInsert} from '@/types';

/**
 * Hook for managing committees data and CRUD operations
 * Handles: fetching, creating, updating, deleting
 */
export function useCommittees() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = translations.admin.committees;

  // Fetch all committees
  const fetchCommittees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_ROUTES.committees.root);
      const response = await res.json();

      setCommittees(response.data || []);
    } catch (error) {
      console.error('Error fetching committees:', error);
      setError(t.responseMessages.committeesFetchFailed);
      showToast.danger(t.responseMessages.committeesFetchFailed);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Add new committee
  const addCommittee = useCallback(
    async (data: CommitteeInsert) => {
      try {
        const res = await fetch(API_ROUTES.committees.root, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data),
        });
        const response = await res.json();

        if (!res.ok || response.error) {
          throw new Error(response.error || 'Failed to add committee');
        }

        showToast.success('Komise byla úspěšně přidána');
        await fetchCommittees();
        return response.data;
      } catch (error) {
        console.error('Error adding committee:', error);
        showToast.danger('Chyba při přidávání komise');
      }
    },
    [fetchCommittees]
  );

  // Update committee
  const updateCommittee = useCallback(
    async (id: string, data: Partial<CommitteeInsert>) => {
      try {
        const res = await fetch(API_ROUTES.committees.byId(id), {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data),
        });
        const response = await res.json();

        if (!res.ok || response.error) {
          throw new Error(response.error || 'Update failed');
        }

        showToast.success('Komise byla úspěšně aktualizována');
        await fetchCommittees();
        return response.data;
      } catch (error) {
        console.error('Error updating committee:', error);
        showToast.danger('Chyba při aktualizaci komise');
      }
    },
    [fetchCommittees]
  );

  // Delete committee
  const deleteCommittee = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(API_ROUTES.committees.byId(id), {
          method: 'DELETE',
        });
        const response = await res.json();

        if (!res.ok || response.error) {
          throw new Error(response.error || 'Delete failed');
        }

        showToast.success('Komise byla úspěšně smazána');
        await fetchCommittees();
      } catch (error) {
        console.error('Error deleting committee:', error);
        showToast.danger('Chyba při mazání komise');
      }
    },
    [fetchCommittees]
  );

  // Automatically fetch committees when hook is first used
  useEffect(() => {
    fetchCommittees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // Data
    committees,
    // Loading states
    loading,
    error,
    // Actions
    fetchCommittees,
    addCommittee,
    updateCommittee,
    deleteCommittee,
  };
}

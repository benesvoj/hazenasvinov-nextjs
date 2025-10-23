'use client';

import {useCallback, useState} from 'react';

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

  // Add new committee
  const createCommittee = useCallback(async (data: CommitteeInsert) => {
    try {
      setLoading(true);
      setError(null);

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
      setCommittees((prev) => [...prev, response.data]);
      return response;
    } catch (error) {
      console.error('Error adding committee:', error);
      showToast.danger('Chyba při přidávání komise');
    }
  }, []);

  // Update committee
  const updateCommittee = useCallback(async (id: string, data: Partial<CommitteeInsert>) => {
    try {
      setLoading(true);
      setError(null);

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
      setCommittees((prev) => prev.map((cat) => (cat.id ? response.data : cat)));
      return response;
    } catch (error) {
      console.error('Error updating committee:', error);
      showToast.danger('Chyba při aktualizaci komise');
    }
  }, []);

  // Delete committee
  const deleteCommittee = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_ROUTES.committees.byId(id), {
        method: 'DELETE',
      });
      const response = await res.json();

      if (!res.ok || response.error) {
        throw new Error(response.error || 'Delete failed');
      }

      showToast.success('Komise byla úspěšně smazána');
      setCommittees((prev) => prev.filter((cat) => cat.id !== id));
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting committee:', error);
      showToast.danger('Chyba při mazání komise');
    }
  }, []);

  return {
    // Data
    committees,

    // Loading states
    loading,
    error,

    // Actions
    createCommittee,
    updateCommittee,
    deleteCommittee,

    // Setters
    setLoading,
  };
}

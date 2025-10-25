'use client';
import {useCallback, useState} from 'react';

import {showToast} from '@/components';
import {API_ROUTES} from '@/lib';
import {NewClub} from '@/types';

export function useClubs() {
  const [club, setClub] = useState<NewClub[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Create new club
  const createClub = useCallback(async (data: NewClub) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_ROUTES.clubs.root, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
      });
      const response = await res.json();

      if (!res.ok || response.error) {
        throw new Error(response.error || 'Failed to create new club');
      }

      showToast.success('Klub byl úspěšně vytvořen.');
      setClub((prev) => [...prev, response.data]);
      return response;
    } catch (error) {
      console.error('Error:', error);
      showToast.danger('Chyba při vytváření klubu');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update club
  const updateClub = useCallback(async (id: string, data: Partial<NewClub>) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_ROUTES.clubs.byId(id), {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
      });
      const response = await res.json();

      if (!res.ok || response.error) {
        throw new Error(response.error || 'Failed to update club');
      }

      showToast.success('Klub byl úspěšně aktualizován');
      setClub((prev) => prev.map((cat) => (cat.id === id ? response.data : cat)));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update club';
      setError(errorMessage);
      showToast.danger('Chyba při aktualizaci klubu');
      console.error('Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteClub = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_ROUTES.clubs.byId(id), {
        method: 'DELETE',
      });
      const response = await res.json();

      if (!res.ok || response.error) {
        throw new Error(response.error || 'Failed to delete club');
      }

      showToast.success('Klub byl úspěšně smazán');
      setClub((prev) => prev.filter((cat) => cat.id !== id));
      return {success: true};
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete club';
      setError(errorMessage);
      showToast.danger('Chyba při mazání klubu');
      console.error('Error deleting club:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Data
    club,

    // Loading state
    loading,
    error,

    //Actions
    createClub,
    updateClub,
    deleteClub,

    // Setters
    setLoading,
  };
}

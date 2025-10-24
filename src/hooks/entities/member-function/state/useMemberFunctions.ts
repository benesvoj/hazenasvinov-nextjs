'use client';

import {useCallback, useState} from 'react';

import {showToast} from '@/components';
import {API_ROUTES} from '@/lib';
import {CreateMemberFunction, MemberFunction} from '@/types';

export function useMemberFunctions() {
  const [memberFunctions, setMemberFunctions] = useState<MemberFunction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMemberFunction = useCallback(async (data: CreateMemberFunction) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_ROUTES.memberFunctions.root, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const response = await res.json();

      if (!res.ok || response.error) {
        throw new Error(response.error || 'Failed to add member function');
      }

      showToast.success('Funkce byla úspěšně přidána');
      setMemberFunctions((prev) => [...prev, response.data]);
      return response;
    } catch (error) {
      console.error('Error: ', error);
      showToast.danger('Chyba pri zakladani zaznamu');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMemberFunction = useCallback(
    async (id: string, data: Partial<CreateMemberFunction>) => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(API_ROUTES.memberFunctions.byId(id), {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data),
        });
        const response = await res.json();

        if (!res.ok || response.error) {
          throw new Error(response.error || 'Nepodarilo se aktualizovat zaznam');
        }

        showToast.success('Zaznam uspesne aktualizovan');
        setMemberFunctions((prev) => prev.map((cat) => (cat.id === id ? response.data : cat)));
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Nepodarilo se aktualizovat zaznam';
        setError(errorMessage);
        console.error('Error updating record:', error);
        return {success: false, error: errorMessage};
      }
    },
    []
  );

  const deleteMemberFunction = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_ROUTES.memberFunctions.byId(id), {
        method: 'DELETE',
      });
      const response = await res.json();

      if (!res.ok || response.error) {
        throw new Error(response.error || 'Neporadilo se smazat zaznam.');
      }

      showToast.success('Zaznam uspesne smazan');
      setMemberFunctions((prev) => prev.filter((cat) => cat.id !== id));
      return {success: true};
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Neporadilo se smazat zaznam.';
      setError(errorMessage);
      console.error('Error deleting record:', error);
      return {success: false, error: errorMessage};
    }
  }, []);

  return {
    // Data
    memberFunctions,

    // State
    loading,
    error,

    // CRUD Operations
    createMemberFunction,
    updateMemberFunction,
    deleteMemberFunction,

    // Setters
    setLoading,

    // Validation
  };
}

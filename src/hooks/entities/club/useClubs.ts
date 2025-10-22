'use client';

import {useCallback, useState} from 'react';

import {ValidationErrors} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {Club} from '@/types';

export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const t = translations.admin.clubs;

  const fetchClubs = useCallback(async () => {
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(API_ROUTES.clubs.root, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t.responseMessages.clubsFetchError);
      }

      setClubs(result.data || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Chyba při načítání klubů';
      setErrors({fetch: errorMessage});
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    clubs,
    loading,
    errors,
    fetchClubs,
  };
}

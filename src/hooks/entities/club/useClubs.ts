'use client';
import {useState, useEffect, useCallback} from 'react';

import {createClient} from '@/utils/supabase/client';

import {Club} from '@/types';

export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClubs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const {data, error} = await supabase
        .from('clubs')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClubs(data || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      setError('Chyba při načítání klubů');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  return {
    clubs,
    loading,
    error,
    fetchClubs,
  };
}

import { useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Team {
  id: string;
  name: string;
  display_name?: string;
  venue?: string;
  is_active: boolean;
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTeams(data || []);
    } catch (err: any) {
      console.error('Error fetching teams:', err);
      setError(err?.message || 'Chyba při načítání týmů');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    teams,
    loading,
    error,
    fetchTeams
  };
}

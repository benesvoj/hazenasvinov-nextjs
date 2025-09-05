import { useState, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Season } from '@/types';

export function useSeasons() {
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sort seasons from newest to oldest
  const sortedSeasons = useMemo(() => {
    return seasons?.sort((a, b) => {
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    }) || [];
  }, [seasons]);

  // Fetch active season only
  const fetchActiveSeason = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('seasons')
        .select('id, name')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setActiveSeason(data);
    } catch (error) {
      console.error('Error fetching active season:', error);
      setError('Chyba při načítání aktivní sezóny');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch active season with full details
  const fetchActiveSeasonFull = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setActiveSeason(data);
    } catch (error) {
      console.error('Error fetching active season:', error);
      setError('Chyba při načítání aktivní sezóny');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all seasons
  const fetchAllSeasons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startTime = Date.now();
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('seasons')
        .select('id, name, start_date, end_date, is_active, is_closed')
        .order('start_date', { ascending: false })
        .limit(50);

      const endTime = Date.now();

      if (error) throw error;
      setSeasons(data || []);
    } catch (error) {
      console.error('Error fetching seasons:', error);
      setError('Chyba při načítání sezón');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch seasons and set active season as default
  const fetchSeasonsWithActive = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('seasons')
        .select('id, name, start_date, end_date, is_active, is_closed')
        .order('start_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setSeasons(data || []);
      
      // Set active season as default
      const active = data?.find((season: Season) => season.is_active);
      if (active) {
        setActiveSeason(active);
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
      setError('Chyba při načítání sezón');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    activeSeason,
    seasons,
    sortedSeasons, // New: seasons sorted from newest to oldest
    loading,
    error,
    fetchActiveSeason,
    fetchActiveSeasonFull,
    fetchAllSeasons,
    fetchSeasonsWithActive,
    setActiveSeason
  };
}

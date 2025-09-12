import {useState, useCallback, useMemo, useEffect} from 'react';
import {createClient} from '@/utils/supabase/client';
import {Season} from '@/types';
import {translations} from '@/lib/translations';

export function useSeasons() {
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = translations.seasons;

  // Sort seasons from newest to oldest
  const sortedSeasons = useMemo(() => {
    return (
      seasons?.sort((a, b) => {
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      }) || []
    );
  }, [seasons]);

  // Fetch active season only
  const fetchActiveSeason = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const {data, error} = await supabase
        .from('seasons')
        .select('id, name, start_date, end_date, is_active, is_closed')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      console.log('I got this season from useSeasons hook', data);
      setActiveSeason(data);
    } catch (error) {
      console.error('Error fetching active season:', error);
      setError('Chyba při načítání aktivní sezóny');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all seasons ordered from newest to oldest
  const fetchAllSeasons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const {data, error} = await supabase
        .from('seasons')
        .select('*')
        .order('start_date', {ascending: false})
        .limit(50);

      if (error) throw error;
      setSeasons(data || []);
    } catch (error) {
      console.error('Error fetching seasons:', error);
      setError('Chyba při načítání sezón');
    } finally {
      setLoading(false);
    }
  }, []);

  // Automatically fetch active season when hook is first used
  useEffect(() => {
    console.log('useSeasons useEffect - activeSeason:', activeSeason, 'loading:', loading);
    if (!activeSeason && !loading) {
      console.log('useSeasons: Fetching active season...');
      fetchActiveSeason();
    }
  }, [activeSeason, loading, fetchActiveSeason]);

  return {
    activeSeason,
    seasons,
    sortedSeasons, // seasons sorted from newest to oldest
    loading,
    error,
    fetchActiveSeason,
    fetchAllSeasons,
    setActiveSeason,
  };
}

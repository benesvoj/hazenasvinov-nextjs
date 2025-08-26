import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Club } from '@/types/types';

export interface ClubsNavigationData {
  clubs: Club[];
  currentIndex: number;
  hasPrevious: boolean;
  hasNext: boolean;
  previousClub: Club | null;
  nextClub: Club | null;
  loading: boolean;
  error: string;
}

export function useClubsNavigation(currentClubId: string): ClubsNavigationData {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const supabase = createClient();

  const fetchClubs = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .order('name');

      if (error) throw error;
      setClubs(data || []);
    } catch (error) {
      setError('Chyba při načítání klubů pro navigaci');
      console.error('Error fetching clubs for navigation:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  // Find current club index
  const currentIndex = clubs.findIndex(club => club.id === currentClubId);
  
  // Navigation helpers
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < clubs.length - 1 && currentIndex !== -1;
  
  const previousClub = hasPrevious ? clubs[currentIndex - 1] : null;
  const nextClub = hasNext ? clubs[currentIndex + 1] : null;

  return {
    clubs,
    currentIndex,
    hasPrevious,
    hasNext,
    previousClub,
    nextClub,
    loading,
    error
  };
}

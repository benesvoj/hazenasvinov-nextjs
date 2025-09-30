import {useState, useCallback, useMemo, useEffect} from 'react';

import {translations} from '@/lib/translations';

import {createClient} from '@/utils/supabase/client';

import {showToast} from '@/components';
import {Season} from '@/types';

export function useSeasons() {
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false,
    is_closed: false,
  });
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

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      is_active: false,
      is_closed: false,
    });
    setError(null);
  }, []);

  // Add new season
  const addSeason = useCallback(async () => {
    try {
      const supabase = createClient();

      // If setting as active, deactivate other seasons
      if (formData.is_active) {
        await supabase.from('seasons').update({is_active: false}).eq('is_active', true);
      }

      const {error} = await supabase.from('seasons').insert({
        name: formData.name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: formData.is_active,
        is_closed: formData.is_closed,
      });

      if (error) throw error;

      showToast.success('Sezóna byla úspěšně přidána');
      resetForm();
      await fetchAllSeasons();
    } catch (error) {
      console.error('Error adding season:', error);
      showToast.danger('Chyba při přidávání sezóny');
    }
  }, [formData, fetchAllSeasons, resetForm]);

  // Update season
  const updateSeason = useCallback(async () => {
    if (!selectedSeason) return;

    try {
      const supabase = createClient();

      // If setting as active, deactivate other seasons
      if (formData.is_active) {
        await supabase
          .from('seasons')
          .update({is_active: false})
          .eq('is_active', true)
          .neq('id', selectedSeason.id);
      }

      const {error} = await supabase
        .from('seasons')
        .update({
          name: formData.name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          is_active: formData.is_active,
          is_closed: formData.is_closed,
        })
        .eq('id', selectedSeason.id);

      if (error) throw error;

      showToast.success('Sezóna byla úspěšně aktualizována');
      setSelectedSeason(null);
      resetForm();
      await fetchAllSeasons();
    } catch (error) {
      console.error('Error updating season:', error);
      showToast.danger('Chyba při aktualizaci sezóny');
    }
  }, [selectedSeason, formData, fetchAllSeasons, resetForm]);

  // Delete season
  const deleteSeason = useCallback(async () => {
    if (!selectedSeason) return;

    try {
      const supabase = createClient();
      const {error} = await supabase.from('seasons').delete().eq('id', selectedSeason.id);

      if (error) throw error;

      showToast.success('Sezóna byla úspěšně smazána');
      setSelectedSeason(null);
      await fetchAllSeasons();
    } catch (error) {
      console.error('Error deleting season:', error);
      showToast.danger('Chyba při mazání sezóny');
    }
  }, [selectedSeason, fetchAllSeasons]);

  // Open edit modal
  const openEditModal = useCallback((season: Season) => {
    setSelectedSeason(season);
    setFormData({
      name: season.name,
      start_date: season.start_date || '',
      end_date: season.end_date || '',
      is_active: season.is_active || false,
      is_closed: season.is_closed || false,
    });
  }, []);

  // Open delete modal
  const openDeleteModal = useCallback((season: Season) => {
    setSelectedSeason(season);
  }, []);

  // Automatically fetch active season when hook is first used
  useEffect(() => {
    if (!activeSeason && !loading) {
      fetchActiveSeason();
    }
  }, [activeSeason, loading, fetchActiveSeason]);

  return {
    // Data
    activeSeason,
    seasons,
    selectedSeason,
    formData,
    /**
     * @description seasons sorted from newest to oldest
     */
    sortedSeasons,
    // Loading states
    loading,
    error,
    // Actions
    fetchActiveSeason,
    fetchAllSeasons,
    addSeason,
    updateSeason,
    deleteSeason,
    openEditModal,
    openDeleteModal,
    resetForm,
    // Setters
    setActiveSeason,
    setFormData,
    setSelectedSeason,
  };
}

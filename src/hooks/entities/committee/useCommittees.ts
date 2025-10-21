'use client';

import {useState, useCallback, useEffect} from 'react';

import {createClient} from '@/utils/supabase/client';

import {showToast} from '@/components';
import {Committee} from '@/types';

export function useCommittees() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [formData, setFormData] = useState<Committee>({
    id: '',
    code: '',
    name: '',
    description: '',
    is_active: true,
    sort_order: 0,
    created_at: '',
    updated_at: '',
  });

  // Fetch all committees
  const fetchCommittees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const {data, error} = await supabase
        .from('committees')
        .select('*')
        .order('sort_order', {ascending: true});

      if (error) throw error;
      setCommittees(data || []);
    } catch (error) {
      console.error('Error fetching committees:', error);
      setError('Chyba při načítání komisí');
      showToast.danger('Chyba při načítání komisí');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new committee
  const addCommittee = useCallback(async () => {
    try {
      const supabase = createClient();

      const {error} = await supabase.from('committees').insert({
        code: formData.code,
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
      });

      if (error) throw error;

      showToast.success('Komise byla úspěšně přidána');
      resetForm();
      await fetchCommittees();
    } catch (error) {
      console.error('Error adding committee:', error);
      showToast.danger('Chyba při přidávání komise');
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [formData, fetchCommittees]);

  // Update committee
  const updateCommittee = useCallback(async () => {
    if (!selectedCommittee) return;

    try {
      const supabase = createClient();

      const {error} = await supabase
        .from('committees')
        .update({
          name: formData.name,
          description: formData.description,
          is_active: formData.is_active,
          sort_order: formData.sort_order,
        })
        .eq('id', selectedCommittee.id);

      if (error) throw error;

      showToast.success('Komise byla úspěšně aktualizována');
      setSelectedCommittee(null);
      resetForm();
      await fetchCommittees();
    } catch (error) {
      console.error('Error updating committee:', error);
      showToast.danger('Chyba při aktualizaci komise');
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [selectedCommittee, formData, fetchCommittees]);

  // Delete committee
  const deleteCommittee = useCallback(async () => {
    if (!selectedCommittee) return;

    try {
      const supabase = createClient();
      const {error} = await supabase.from('committees').delete().eq('id', selectedCommittee.id);

      if (error) throw error;

      showToast.success('Komise byla úspěšně smazána');
      setSelectedCommittee(null);
      await fetchCommittees();
    } catch (error) {
      console.error('Error deleting committee:', error);
      showToast.danger('Chyba při mazání komise');
    }
  }, [selectedCommittee, fetchCommittees]);

  // Open edit modal
  const openEditModal = useCallback((committee: Committee) => {
    setSelectedCommittee(committee);
    setFormData(committee);
  }, []);

  // Open delete modal
  const openDeleteModal = useCallback((committee: Committee) => {
    setSelectedCommittee(committee);
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      id: '',
      code: '',
      name: '',
      description: '',
      is_active: true,
      sort_order: 0,
      created_at: '',
      updated_at: '',
    });
    setError(null);
  }, []);

  // Automatically fetch committees when hook is first used
  useEffect(() => {
    if (committees.length === 0 && !loading) {
      fetchCommittees();
    }
  }, [committees.length, loading, fetchCommittees]);

  return {
    // Data
    committees,
    selectedCommittee,
    formData,
    // Loading states
    loading,
    error,
    // Actions
    fetchCommittees,
    addCommittee,
    updateCommittee,
    deleteCommittee,
    openEditModal,
    openDeleteModal,
    resetForm,
    // Setters
    setFormData,
    setSelectedCommittee,
  };
}

'use client';

import {useState, useEffect, useCallback} from 'react';

import {createClient} from '@/utils/supabase/client';

import {ClubCategory, Club, Category, Season} from '@/types';

export interface UseClubCategoriesFilters {
  searchTerm?: string;
  selectedSeason?: string;
}

export interface CreateClubCategoryData {
  club_id: string;
  category_id: string;
  season_id: string;
  max_teams: number;
}

export interface UpdateClubCategoryData extends CreateClubCategoryData {
  id: string;
}

export function useClubCategories(filters?: UseClubCategoriesFilters) {
  const [clubCategories, setClubCategories] = useState<ClubCategory[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch club categories with filters
  const fetchClubCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('club_categories')
        .select(
          `
          *,
          club:clubs(*),
          category:categories(*),
          season:seasons(*)
        `
        )
        .order('season_id', {ascending: false})
        .order('category_id')
        .order('club_id');

      if (filters?.selectedSeason) {
        query = query.eq('season_id', filters.selectedSeason);
      }

      const {data, error} = await query;

      if (error) throw error;
      setClubCategories(data || []);
    } catch (error) {
      console.error('Error fetching club categories:', error);
      setError('Chyba při načítání přiřazení klubů');
    } finally {
      setLoading(false);
    }
  }, [supabase, filters?.selectedSeason]);

  // Fetch reference data (clubs, categories, seasons)
  const fetchReferenceData = useCallback(async () => {
    try {
      const [clubsResult, categoriesResult, seasonsResult] = await Promise.all([
        supabase.from('clubs').select('*').eq('is_active', true).order('name'),
        supabase.from('categories').select('*').eq('is_active', true).order('name'),
        supabase.from('seasons').select('*').order('name', {ascending: false}),
      ]);

      if (clubsResult.error) throw clubsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      if (seasonsResult.error) throw seasonsResult.error;

      setClubs(clubsResult.data || []);
      setCategories(categoriesResult.data || []);
      setSeasons(seasonsResult.data || []);
    } catch (error) {
      console.error('Error fetching reference data:', error);
      setError('Chyba při načítání referenčních dat');
    }
  }, [supabase]);

  // Create club category assignment
  const createClubCategory = useCallback(
    async (data: CreateClubCategoryData) => {
      try {
        setError(null);

        // Check if assignment already exists
        const {data: existing, error: checkError} = await supabase
          .from('club_categories')
          .select('id')
          .eq('club_id', data.club_id)
          .eq('category_id', data.category_id)
          .eq('season_id', data.season_id);

        if (checkError) throw checkError;

        if (existing && existing.length > 0) {
          throw new Error('Tento klub je již přiřazen k této kategorii v této sezóně');
        }

        const {error} = await supabase.from('club_categories').insert(data);

        if (error) throw error;

        // Refresh data
        await fetchClubCategories();
        return {success: true};
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Chyba při vytváření přiřazení';
        setError(errorMessage);
        console.error('Error creating club category:', error);
        return {success: false, error: errorMessage};
      }
    },
    [supabase, fetchClubCategories]
  );

  // Update club category assignment
  const updateClubCategory = useCallback(
    async (data: UpdateClubCategoryData) => {
      try {
        setError(null);

        const {error} = await supabase
          .from('club_categories')
          .update({
            club_id: data.club_id,
            category_id: data.category_id,
            season_id: data.season_id,
            max_teams: data.max_teams,
          })
          .eq('id', data.id);

        if (error) throw error;

        // Refresh data
        await fetchClubCategories();
        return {success: true};
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Chyba při aktualizaci přiřazení';
        setError(errorMessage);
        console.error('Error updating club category:', error);
        return {success: false, error: errorMessage};
      }
    },
    [supabase, fetchClubCategories]
  );

  // Delete club category assignment
  const deleteClubCategory = useCallback(
    async (id: string) => {
      try {
        setError(null);

        const {error} = await supabase.from('club_categories').delete().eq('id', id);

        if (error) throw error;

        // Refresh data
        await fetchClubCategories();
        return {success: true};
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Chyba při mazání přiřazení';
        setError(errorMessage);
        console.error('Error deleting club category:', error);
        return {success: false, error: errorMessage};
      }
    },
    [supabase, fetchClubCategories]
  );

  // Filter club categories based on search term
  const getFilteredClubCategories = useCallback(() => {
    if (!filters?.searchTerm) return clubCategories;

    return clubCategories.filter(
      (cc) =>
        cc.club?.name.toLowerCase().includes(filters.searchTerm!.toLowerCase()) ||
        cc.category?.name.toLowerCase().includes(filters.searchTerm!.toLowerCase()) ||
        cc.season?.name.toLowerCase().includes(filters.searchTerm!.toLowerCase())
    );
  }, [clubCategories, filters?.searchTerm]);

  // Initial data fetch
  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  // Fetch club categories when filters change
  useEffect(() => {
    if (filters?.selectedSeason) {
      fetchClubCategories();
    }
  }, [fetchClubCategories, filters?.selectedSeason]);

  return {
    // Data
    clubCategories: getFilteredClubCategories(),
    clubs,
    categories,
    seasons,

    // State
    loading,
    error,

    // Actions
    createClubCategory,
    updateClubCategory,
    deleteClubCategory,
    fetchClubCategories,
    fetchReferenceData,

    // Utilities
    clearError: () => setError(null),
  };
}

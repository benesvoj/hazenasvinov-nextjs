import {useState, useEffect, useCallback} from 'react';

import {createClient} from '@/utils/supabase/client';

import {Category, UseCategoriesFilters, CreateCategoryData, UpdateCategoryData} from '@/types';

export function useCategories(filters?: UseCategoriesFilters) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch categories with filters
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('categories')
        .select('*')
        .order('sort_order', {ascending: true})
        .order('name', {ascending: true});

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      const {data, error} = await query;

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Chyba při načítání kategorií');
    } finally {
      setLoading(false);
    }
  }, [supabase, filters?.isActive]);

  // Create category
  const createCategory = useCallback(
    async (data: CreateCategoryData) => {
      try {
        setError(null);

        const {error} = await supabase.from('categories').insert({
          name: data.name,
          description: data.description || null,
          age_group: data.age_group || null,
          gender: data.gender || null,
          is_active: data.is_active ?? true,
          sort_order: data.sort_order || 0,
        });

        if (error) throw error;

        // Refresh data
        await fetchCategories();
        return {success: true};
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Chyba při vytváření kategorie';
        setError(errorMessage);
        console.error('Error creating category:', error);
        return {success: false, error: errorMessage};
      }
    },
    [supabase, fetchCategories]
  );

  // Update category
  const updateCategory = useCallback(
    async (data: UpdateCategoryData) => {
      try {
        setError(null);

        const {error} = await supabase
          .from('categories')
          .update({
            name: data.name,
            description: data.description || null,
            age_group: data.age_group || null,
            gender: data.gender || null,
            is_active: data.is_active ?? true,
            sort_order: data.sort_order || 0,
          })
          .eq('id', data.id);

        if (error) throw error;

        // Refresh data
        await fetchCategories();
        return {success: true};
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Chyba při aktualizaci kategorie';
        setError(errorMessage);
        console.error('Error updating category:', error);
        return {success: false, error: errorMessage};
      }
    },
    [supabase, fetchCategories]
  );

  // Delete category
  const deleteCategory = useCallback(
    async (id: string) => {
      try {
        setError(null);

        const {error} = await supabase.from('categories').delete().eq('id', id);

        if (error) throw error;

        // Refresh data
        await fetchCategories();
        return {success: true};
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Chyba při mazání kategorie';
        setError(errorMessage);
        console.error('Error deleting category:', error);
        return {success: false, error: errorMessage};
      }
    },
    [supabase, fetchCategories]
  );

  // Filter categories based on search term
  const getFilteredCategories = useCallback(() => {
    if (!filters?.searchTerm) return categories;

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(filters.searchTerm!.toLowerCase()) ||
        (category.description &&
          category.description.toLowerCase().includes(filters.searchTerm!.toLowerCase()))
    );
  }, [categories, filters?.searchTerm]);

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    // Data
    categories: getFilteredCategories(),

    // State
    loading,
    error,

    // Actions
    createCategory,
    updateCategory,
    deleteCategory,
    fetchCategories,

    // Utilities
    clearError: () => setError(null),
  };
}

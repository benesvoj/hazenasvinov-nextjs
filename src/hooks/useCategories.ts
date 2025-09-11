import { useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Category } from '@/types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all active categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('id, slug, name')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Chyba při načítání kategorií');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories with full details
  const fetchCategoriesFull = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      setError('Chyba při načítání kategorií');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories for a specific season
  const fetchCategoriesForSeason = useCallback(async (seasonId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('id, slug, name, description, sort_order')
        .eq('season_id', seasonId)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      setError('Chyba při načítání kategorií pro sezónu');
    } finally {
      setLoading(false);
    }
  }, []);

  // No auto-fetch - components should call fetchCategories explicitly

  return {
    categories,
    loading,
    error,
    fetchCategories,
    fetchCategoriesFull,
    fetchCategoriesForSeason,
    setCategories
  };
}

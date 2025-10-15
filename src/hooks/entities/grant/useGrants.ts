import {useState, useCallback} from 'react';

import {createClient} from '@/utils/supabase/client';

import {Grant} from '@/types';

interface GrantFilters {
  month?: number;
  search?: string;
}

interface CreateGrantInput {
  name: string;
  description?: string;
  month: number;
}

interface UpdateGrantInput {
  name?: string;
  description?: string;
  month?: number;
}

export function useGrants() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGrants = useCallback(async (filters: GrantFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      let query = supabase
        .from('grants')
        .select('*')
        .eq('is_active', true)
        .order('month', {ascending: true})
        .order('name', {ascending: true});

      // Apply filters
      if (filters.month !== undefined) {
        query = query.eq('month', filters.month);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const {data, error} = await query;

      if (error) throw error;

      setGrants(data || []);
    } catch (err: any) {
      console.error('Error fetching grants:', err);
      setError(err?.message || 'Error loading grants');
    } finally {
      setLoading(false);
    }
  }, []);

  const createGrant = useCallback(
    async (grantData: CreateGrantInput) => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // Get current user
        const {
          data: {user},
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('User not authenticated');
        }

        const {data, error} = await supabase
          .from('grants')
          .insert({
            name: grantData.name,
            description: grantData.description || null,
            month: grantData.month,
            created_by: user.id,
            is_active: true,
          })
          .select()
          .single();

        if (error) {
          console.error('Grant creation error:', error);
          throw new Error(`Error creating grant: ${error.message}`);
        }

        // Refresh the list
        await fetchGrants();

        return data;
      } catch (err: any) {
        console.error('Error creating grant:', err);
        setError(err?.message || 'Error creating grant');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchGrants]
  );

  const updateGrant = useCallback(
    async (id: string, grantData: UpdateGrantInput) => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        const updateData: any = {};
        if (grantData.name !== undefined) updateData.name = grantData.name;
        if (grantData.description !== undefined)
          updateData.description = grantData.description || null;
        if (grantData.month !== undefined) updateData.month = grantData.month;

        const {data, error} = await supabase
          .from('grants')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        // Refresh the list
        await fetchGrants();

        return data;
      } catch (err: any) {
        console.error('Error updating grant:', err);
        setError(err?.message || 'Error updating grant');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchGrants]
  );

  const deleteGrant = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // Soft delete by setting is_active to false
        const {error} = await supabase.from('grants').update({is_active: false}).eq('id', id);

        if (error) throw error;

        // Refresh the list
        await fetchGrants();
      } catch (err: any) {
        console.error('Error deleting grant:', err);
        setError(err?.message || 'Error deleting grant');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchGrants]
  );

  const hardDeleteGrant = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // Hard delete - permanently remove from database
        const {error} = await supabase.from('grants').delete().eq('id', id);

        if (error) throw error;

        // Refresh the list
        await fetchGrants();
      } catch (err: any) {
        console.error('Error permanently deleting grant:', err);
        setError(err?.message || 'Error permanently deleting grant');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchGrants]
  );

  return {
    grants,
    loading,
    error,
    fetchGrants,
    createGrant,
    updateGrant,
    deleteGrant,
    hardDeleteGrant,
  };
}

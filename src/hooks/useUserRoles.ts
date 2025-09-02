import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient } from './useSupabaseClient';
import { UserRole, CoachCategory, UserRoleSummary, RoleAssignment } from '@/types';

export function useUserRoles() {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [coachCategories, setCoachCategories] = useState<CoachCategory[]>([]);
  const [userRoleSummaries, setUserRoleSummaries] = useState<UserRoleSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabaseClient();

  // Fetch all user role summaries
  const fetchUserRoleSummaries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_role_summary')
        .select('*')
        .order('full_name');

      if (error) throw error;

      setUserRoleSummaries(data || []);
    } catch (err) {
      console.error('Error fetching user role summaries:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user roles');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Fetch roles for a specific user
  const fetchUserRoles = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching user roles:', err);
      throw err;
    }
  }, [supabase]);

  // Fetch coach categories for a specific user
  const fetchCoachCategories = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('coach_categories')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching coach categories:', err);
      throw err;
    }
  }, [supabase]);

  // Assign roles to a user
  const assignRoles = useCallback(async (userId: string, roles: ('admin' | 'coach')[]) => {
    try {
      setLoading(true);
      setError(null);

      // First, remove existing roles for this user
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Then add new roles
      if (roles.length > 0) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const roleInserts = roles.map(role => ({
          user_id: userId,
          role,
          created_by: currentUser?.id
        }));

        const { error } = await supabase
          .from('user_roles')
          .insert(roleInserts);

        if (error) throw error;
      }

      // Refresh the summaries
      await fetchUserRoleSummaries();
    } catch (err) {
      console.error('Error assigning roles:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign roles');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchUserRoleSummaries]);

  // Assign categories to a coach
  const assignCoachCategories = useCallback(async (userId: string, categoryIds: string[]) => {
    try {
      setLoading(true);
      setError(null);

      // First, remove existing category assignments for this user
      await supabase
        .from('coach_categories')
        .delete()
        .eq('user_id', userId);

      // Then add new category assignments
      if (categoryIds.length > 0) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const categoryInserts = categoryIds.map(categoryId => ({
          user_id: userId,
          category_id: categoryId,
          created_by: currentUser?.id
        }));

        const { error } = await supabase
          .from('coach_categories')
          .insert(categoryInserts);

        if (error) throw error;
      }

      // Refresh the summaries
      await fetchUserRoleSummaries();
    } catch (err) {
      console.error('Error assigning coach categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign coach categories');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchUserRoleSummaries]);

  // Complete role assignment (roles + categories)
  const assignUserRoles = useCallback(async (assignment: RoleAssignment) => {
    try {
      setLoading(true);
      setError(null);

      // Assign roles
      await assignRoles(assignment.userId, assignment.roles);

      // If user has coach role, assign categories
      if (assignment.roles.includes('coach')) {
        await assignCoachCategories(assignment.userId, assignment.categories);
      } else {
        // If user doesn't have coach role, remove all category assignments
        await assignCoachCategories(assignment.userId, []);
      }

      // Refresh the summaries
      await fetchUserRoleSummaries();
    } catch (err) {
      console.error('Error assigning user roles:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign user roles');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [assignRoles, assignCoachCategories, fetchUserRoleSummaries]);

  // Check if current user has a specific role
  const hasRole = useCallback(async (role: 'admin' | 'coach'): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', role)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (err) {
      console.error('Error checking user role:', err);
      return false;
    }
  }, [supabase]);

  // Get current user's assigned categories (for coaches)
  const getCurrentUserCategories = useCallback(async (): Promise<string[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('coach_categories')
        .select('category_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data?.map(item => item.category_id) || [];
    } catch (err) {
      console.error('Error fetching current user categories:', err);
      return [];
    }
  }, [supabase]);

  // Load initial data
  useEffect(() => {
    fetchUserRoleSummaries();
  }, [fetchUserRoleSummaries]);

  return {
    userRoleSummaries,
    loading,
    error,
    fetchUserRoleSummaries,
    fetchUserRoles,
    fetchCoachCategories,
    assignRoles,
    assignCoachCategories,
    assignUserRoles,
    hasRole,
    getCurrentUserCategories,
  };
}

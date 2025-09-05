import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabaseClient } from './useSupabaseClient';
import { UserRole, CoachCategory, UserRoleSummary, RoleAssignment } from '@/types';

export function useUserRoles() {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [coachCategories, setCoachCategories] = useState<CoachCategory[]>([]);
  const [userRoleSummaries, setUserRoleSummaries] = useState<UserRoleSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabaseClient();
  const fetchUserRoleSummariesRef = useRef<() => Promise<void>>();
  const supabaseRef = useRef(supabase);
  supabaseRef.current = supabase;

  // Fetch all user role summaries
  const fetchUserRoleSummaries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the API endpoint to get user role summaries with email data
      const response = await fetch('/api/user-roles');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user roles');
      }

      const { data } = await response.json();
      setUserRoleSummaries(data || []);
    } catch (err) {
      console.error('Error fetching user role summaries:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user roles');
    } finally {
      setLoading(false);
    }
  }, []);

  // Store the function in ref to avoid circular dependencies
  fetchUserRoleSummariesRef.current = fetchUserRoleSummaries;

  // Fetch roles for a specific user
  const fetchUserRoles = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabaseRef.current
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }); // Get most recent first

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching user roles:', err);
      throw err;
    }
  }, []);

  // Fetch coach categories for a specific user
  const fetchCoachCategories = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabaseRef.current
        .from('user_profiles')
        .select('assigned_categories')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data?.assigned_categories || [];
    } catch (err) {
      console.error('Error fetching coach categories:', err);
      throw err;
    }
  }, []);

  // Assign role to a user (user_profiles has single role per user)
  const assignRoles = useCallback(async (userId: string, roles: ('admin' | 'coach')[]) => {
    try {
      setLoading(true);
      setError(null);

      // user_profiles table has single role per user, so we take the first role
      const primaryRole = roles[0] || 'member';
      
      // Check if user already has a profile
      const { data: existingProfile } = await supabaseRef.current
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      const { data: { user: currentUser } } = await supabaseRef.current.auth.getUser();

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabaseRef.current
          .from('user_profiles')
          .update({
            role: primaryRole,
            assigned_categories: primaryRole === 'coach' ? [] : null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabaseRef.current
          .from('user_profiles')
          .insert({
            user_id: userId,
            role: primaryRole,
            assigned_categories: primaryRole === 'coach' ? [] : null,
            created_by: currentUser?.id
          });

        if (error) throw error;
      }

      // Refresh the summaries
      if (fetchUserRoleSummariesRef.current) {
        await fetchUserRoleSummariesRef.current();
      }
    } catch (err) {
      console.error('Error assigning roles:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign roles');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Assign categories to a coach
  const assignCoachCategories = useCallback(async (userId: string, categoryIds: string[]) => {
    try {
      setLoading(true);
      setError(null);

      // Update user_profiles with assigned_categories array
      const { error } = await supabaseRef.current
        .from('user_profiles')
        .update({
          assigned_categories: categoryIds,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh the summaries
      if (fetchUserRoleSummariesRef.current) {
        await fetchUserRoleSummariesRef.current();
      }
    } catch (err) {
      console.error('Error assigning coach categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign coach categories');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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
      if (fetchUserRoleSummariesRef.current) {
        await fetchUserRoleSummariesRef.current();
      }
    } catch (err) {
      console.error('Error assigning user roles:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign user roles');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [assignRoles, assignCoachCategories]);

  // Check if current user has a specific role
  const hasRole = useCallback(async (role: 'admin' | 'coach'): Promise<boolean> => {
    try {
      const { data: { user } } = await supabaseRef.current.auth.getUser();
      if (!user) return false;

      // Check user_profiles table (primary system)
      const { data: profileData, error: profileError } = await supabaseRef.current
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', role);

      if (!profileError && profileData && profileData.length > 0) {
        return true;
      }

      // Fallback: Check user_roles table (legacy system)
      const { data: roleData, error: roleError } = await supabaseRef.current
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', role);

      if (!roleError && roleData && roleData.length > 0) {
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error checking user role:', err);
      return false;
    }
  }, []);

  // Get current user's assigned categories (for coaches)
  const getCurrentUserCategories = useCallback(async (): Promise<string[]> => {
    try {
      const { data: { user } } = await supabaseRef.current.auth.getUser();
      if (!user) return [];

      // Check if we're in admin category testing mode
      if (typeof window !== 'undefined') {
        const simulationData = localStorage.getItem('adminCategorySimulation');
        if (simulationData) {
          try {
            const { selectedCategories } = JSON.parse(simulationData);
            if (selectedCategories && selectedCategories.length > 0) {
              return selectedCategories;
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }

      const { data, error } = await supabaseRef.current
        .from('user_profiles')
        .select('assigned_categories, role')
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Handle multiple profiles - prefer coach/head_coach profile
      if (data && data.length > 0) {
        // Find coach profile first
        const coachProfile = data.find(profile => 
          profile.role === 'coach' || profile.role === 'head_coach'
        );
        
        if (coachProfile) {
          return coachProfile.assigned_categories || [];
        }
        
        // If no coach profile, use the first profile
        return data[0]?.assigned_categories || [];
      }
      
      return [];
    } catch (err) {
      console.error('Error fetching current user categories:', err);
      return [];
    }
  }, []); // Empty dependency array - use ref instead

  // Removed automatic fetch - components should call fetchUserRoleSummaries explicitly

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

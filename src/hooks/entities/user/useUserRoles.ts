'use client';

import {useCallback, useMemo, useRef, useState} from 'react';

import {useUser} from '@/contexts';
import {useFetchRoleDefinitions, useSupabaseClient} from '@/hooks';
import {
  RoleAssignment,
  RoleOperationResult,
  UpsertUserProfileInput,
  UserProfile,
  UserRoleSummary,
  ValidationResult,
} from '@/types';
import {getRoleById, getRoleByName, hasItems, isValidRole, roleRequiresCategories} from '@/utils';

export function useUserRoles() {
  const [userRoleSummaries, setUserRoleSummaries] = useState<UserRoleSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabaseClient();
  const {user, userProfile, userCategories, refreshProfile} = useUser();
  const fetchUserRoleSummariesRef = useRef<() => Promise<void>>();
  const supabaseRef = useRef(supabase);
  supabaseRef.current = supabase;

  const {
    data: roleDefinitions,
    loading: rolesLoading,
    error: rolesError,
    refetch: refetchRoles,
  } = useFetchRoleDefinitions();

  // Filter to only active roles, maybe add as parameter to the hook later
  const activeRoles = useMemo(() => {
    return (roleDefinitions || []).filter((rd) => rd.is_active !== false);
  }, [roleDefinitions]);

  // Validate role assignment before upsert
  const validateRoleAssignment = useCallback(
    (input: UpsertUserProfileInput): ValidationResult => {
      const errors: string[] = [];

      if (!input.userId) {
        errors.push('User ID is required');
      }

      if (!input.roleId) {
        errors.push('Role ID is required');
      }

      // Validate role exists and is active
      const roleDef = getRoleById(input.roleId, roleDefinitions || []);
      if (!roleDef) {
        errors.push(`Role with ID "${input.roleId}" not found`);
      } else if (roleDef.is_active === false) {
        errors.push(`Role "${roleDef.display_name}" is inactive`);
      }

      // Check category requirements
      if (roleDef && roleRequiresCategories(roleDef)) {
        if (!input.assignedCategories || input.assignedCategories.length === 0) {
          errors.push(`Role "${roleDef.display_name}" requires at least one category assignment`);
        }
      }

      return {
        valid: errors.length === 0,
        errors: hasItems(errors) ? errors : undefined,
      };
    },
    [roleDefinitions]
  );

  // Upsert user profile (single source of truth for role assignment)
  const upsertUserProfile = useCallback(
    async (input: UpsertUserProfileInput): Promise<RoleOperationResult> => {
      const validation = validateRoleAssignment(input);
      if (!validation.valid) {
        const errorMessage = validation.errors?.join('; ');
        setError(errorMessage || 'Invalid role assignment');
        return {success: false, error: errorMessage};
      }

      setLoading(true);
      setError(null);

      try {
        const {
          data: {user: currentUser},
        } = await supabaseRef.current.auth.getUser();

        // Use upsert with correct constraint (user_id only)
        const {data, error: upsertError} = await supabaseRef.current
          .from('user_profiles')
          .upsert(
            {
              user_id: input.userId,
              role: input.roleName, // Backward compat
              role_id: input.roleId, // New FK reference
              assigned_categories: input.assignedCategories,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: ['user_id', 'role_id'],
              ignoreDuplicates: false,
            }
          )
          .select()
          .single();

        if (upsertError) {
          throw upsertError;
        }

        return {success: true, data: data as UserProfile};
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update user profile';
        console.error('Error upserting user profile:', err);
        setError(errorMessage);
        return {success: false, error: errorMessage};
      } finally {
        setLoading(false);
      }
    },
    [validateRoleAssignment]
  );

  // Fetch profiles for a specific user
  const fetchUserProfiles = useCallback(async (userId: string): Promise<UserProfile[]> => {
    try {
      const {data, error} = await supabaseRef.current
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', {ascending: false});

      if (error) throw error;
      return (data || []) as UserProfile[];
    } catch (err) {
      console.error('Error fetching user profiles:', err);
      throw err;
    }
  }, []);

  // Delete a user profile
  const deleteUserProfile = useCallback(async (profileId: string): Promise<RoleOperationResult> => {
    setLoading(true);
    setError(null);

    try {
      const {error: deleteError} = await supabaseRef.current
        .from('user_profiles')
        .delete()
        .eq('id', profileId);

      if (deleteError) throw deleteError;

      return {success: true};
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete profile';
      console.error('Error deleting user profile:', err);
      setError(errorMessage);
      return {success: false, error: errorMessage};
    } finally {
      setLoading(false);
    }
  }, []);

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

      const {data} = await response.json();
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
      const {data, error} = await supabaseRef.current
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', {ascending: false}); // Get most recent first

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching user roles:', err);
      throw err;
    }
  }, []);

  // Fetch coach category for a specific user
  const fetchCoachCategories = useCallback(async (userId: string) => {
    try {
      const {data, error} = await supabaseRef.current
        .from('user_profiles')
        .select('assigned_categories')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data?.assigned_categories || [];
    } catch (err) {
      console.error('Error fetching coach category:', err);
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
      const {data: existingProfile} = await supabaseRef.current
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      const {
        data: {user: currentUser},
      } = await supabaseRef.current.auth.getUser();

      if (existingProfile) {
        // Update existing profile
        const {error} = await supabaseRef.current
          .from('user_profiles')
          .update({
            role: primaryRole,
            assigned_categories: primaryRole === 'coach' ? [] : null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Create new profile
        const {error} = await supabaseRef.current.from('user_profiles').insert({
          user_id: userId,
          role: primaryRole,
          assigned_categories: primaryRole === 'coach' ? [] : null,
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

  // Assign category to a coach
  const assignCoachCategories = useCallback(async (userId: string, categoryIds: string[]) => {
    try {
      setLoading(true);
      setError(null);

      // Update user_profiles with assigned_categories array
      const {error} = await supabaseRef.current
        .from('user_profiles')
        .update({
          assigned_categories: categoryIds,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh the summaries
      if (fetchUserRoleSummariesRef.current) {
        await fetchUserRoleSummariesRef.current();
      }
    } catch (err) {
      console.error('Error assigning coach category:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign coach category');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Complete role assignment (roles + category)
  const assignUserRoles = useCallback(
    async (assignment: RoleAssignment) => {
      try {
        setLoading(true);
        setError(null);

        // Assign roles (filter to only admin/coach roles)
        const validRoles = assignment.roles.filter(
          (role) => role === 'admin' || role === 'coach'
        ) as ('admin' | 'coach')[];
        await assignRoles(assignment.userId, validRoles);

        // If user has coach role, assign category
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
    },
    [assignRoles, assignCoachCategories]
  );

  // Check if current user has a specific role
  const hasRole = useCallback(
    async (role: string): Promise<boolean> => {
      if (!user || !userProfile) return false;
      return userProfile.role === role;
    },
    [user, userProfile]
  );

  // Get current user's assigned category (for coaches)
  const getCurrentUserCategories = useCallback(async (): Promise<string[]> => {
    try {
      if (!user) return [];

      // Check if we're in admin category testing mode
      if (typeof window !== 'undefined') {
        const simulationData = localStorage.getItem('adminCategorySimulation');
        if (simulationData) {
          try {
            const {selectedCategories} = JSON.parse(simulationData);
            if (selectedCategories && selectedCategories.length > 0) {
              return selectedCategories;
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }

      // Return category from UserContext
      return userCategories;
    } catch (err) {
      console.error('Error fetching current user category:', err);
      return [];
    }
  }, [user, userCategories]);

  // Removed automatic fetch - components should call fetchUserRoleSummaries explicitly

  // Check if a role requires categories (dynamic)
  const checkRoleRequiresCategories = useCallback(
    (roleIdOrName: string): boolean => {
      const roleDef =
        getRoleById(roleIdOrName, roleDefinitions || []) ||
        getRoleByName(roleIdOrName, roleDefinitions || []);
      return roleRequiresCategories(roleDef || null);
    },
    [roleDefinitions]
  );

  return {
    // State
    userRoleSummaries,
    loading: loading || rolesLoading,
    error: error || rolesError,

    // Role definitions (dynamic)
    roleDefinitions: activeRoles,
    rolesLoading,
    refetchRoles,

    // Core operations
    upsertUserProfile,
    deleteUserProfile,
    fetchUserProfiles,
    validateRoleAssignment,

    // Existing operations
    fetchUserRoleSummaries,
    hasRole,
    getCurrentUserCategories,

    // UserContext data
    coachCategories: userCategories,
    fetchUserRoles,

    // Utilities (dynamic)
    checkRoleRequiresCategories,
    getRoleByName: (name: string) => getRoleByName(name, roleDefinitions || []),
    getRoleById: (id: string) => getRoleById(id, roleDefinitions || []),
    inValidRole: (name: string) => isValidRole(name, roleDefinitions || []),

    // Backwards compatibility
    fetchCoachCategories,
    assignRoles,
    assignCoachCategories,
    assignUserRoles,
  };
}

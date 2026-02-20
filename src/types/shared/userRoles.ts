import {RoleDefinitionSchema} from '@/types';

export interface UserRoleSummary {
  user_id: string;
  /** Keep for backward compatibility **/
  profile_role: string;
  roles: string[];
  assigned_categories: string[];
  assigned_category_names: string[];
  assigned_category_codes: string[];
  /** These fields are populated separately from user_profiles **/
  email?: string;
  full_name?: string;
}

export interface RoleAssignment {
  userId: string;
  roles: string[];
  categories: string[]; // category IDs for coach role
}

/**
 * Strongly-typed role permissions
 * Replaces generic Json type from database schema
 */
export interface RolePermissions {
  /** Role requires category assignment (e.g., coach, head_coach) */
  requires_categories?: boolean;

  /** Can manage other users (admin only) */
  can_manage_users?: boolean;

  /** Can view all categories regardless of assignment */
  can_view_all_categories?: boolean;

  /** Future permissions can be added here */
  [key: string]: boolean | string | number | undefined;
}

/** Extended role definition with typed permissions */
export interface RoleDefinitionWithPermissions extends Omit<RoleDefinitionSchema, 'permissions'> {
  permissions: RolePermissions | null;
}

/**
 * Role definition with typed permissions
 */
export interface RoleDefinitionTyped {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  permissions: RolePermissions;
  created_at: string | null;
}

/** User profile from database */
export interface UserProfile {
  id: string;
  user_id: string;
  /** Role name (backward compat) **/
  role: string;
  /** FK to role_definitions **/
  role_id: string | null;
  assigned_categories: string[] | null;
  created_at: string;
  updated_at: string;
}

/** Summary of user roles for admin view */
export interface UserRoleSummary {
  user_id: string;
  profile_role: string;
  roles: string[];
  assigned_categories: string[];
  assigned_category_names: string[];
  assigned_category_codes: string[];
  email?: string;
  full_name?: string;
}

/** Input for role assignment */
export interface RoleAssignment {
  userId: string;
  roles: string[];
  categories: string[];
}

/** Input for upserting a user profile */
export interface UpsertUserProfileInput {
  userId: string;
  /**  UUID from role_definitions **/
  roleId: string;
  /** Role name for backward compat **/
  roleName: string;
  assignedCategories: string[] | null;
}

/** Result from role operations */
export interface RoleOperationResult {
  success: boolean;
  error?: string;
  data?: UserProfile;
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

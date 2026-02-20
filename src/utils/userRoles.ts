import {RoleDefinitionSchema, RoleDefinitionWithPermissions, RolePermissions} from '@/types';

/**
 * Check if a role requires category assignment.
 * Uses permissions.requires_categories from role_definitions.
 */
export function roleRequiresCategories(
  roleDefinition: RoleDefinitionWithPermissions | RoleDefinitionSchema | null
): boolean {
  if (!roleDefinition) return false;

  const permissions = roleDefinition.permissions as RolePermissions | null;
  return permissions?.requires_categories === true;
}

/**
 * Check if a role name is valid against fetched role definitions.
 */
export function isValidRole(roleName: string, roleDefinitions: RoleDefinitionSchema[]): boolean {
  return roleDefinitions.some((rd) => rd.name === roleName && rd.is_active !== false);
}

/**
 * Get role definition by name.
 */
export function getRoleByName(
  roleName: string,
  roleDefinitions: RoleDefinitionSchema[]
): RoleDefinitionSchema | undefined {
  return roleDefinitions.find((rd) => rd.name === roleName);
}

/**
 * Get role definition by ID.
 */
export function getRoleById(
  roleId: string,
  roleDefinitions: RoleDefinitionSchema[]
): RoleDefinitionSchema | undefined {
  return roleDefinitions.find((rd) => rd.id === roleId);
}

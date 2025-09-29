import {
  getAgeGroupsOptions,
  getBlogPostStatusOptions,
  getCompetitionTypeOptions,
  getGenderOptions,
  getLineupCoachRoleOptions,
  getLineupErrorTypeOptions,
  getLineupRoleOptions,
  getMemberFunctionOptions,
  getPlayerPositionOptions,
  getRelationshipStatusOptions,
  getRelationshipTypeOptions,
  getTeamTypesOptions,
  getUserRolesOptions,
} from '@/enums';

/**
 * Convert enum options to Record<string, string> format for UI components
 */
export const createOptionsRecord = <T extends string>(
  options: Array<{value: T; label: string}>
): Record<string, string> => {
  return options.reduce(
    (acc, {value, label}) => {
      acc[value] = label;
      return acc;
    },
    {} as Record<string, string>
  );
};

// Pre-built option records for common use cases
export const ageGroupsOptions = createOptionsRecord(getAgeGroupsOptions());
export const blogPostStatusOptions = createOptionsRecord(getBlogPostStatusOptions());
export const competitionTypeOptions = createOptionsRecord(getCompetitionTypeOptions());
export const genderOptions = createOptionsRecord(getGenderOptions());
export const lineupCoachRoleOptions = createOptionsRecord(getLineupCoachRoleOptions());
export const lineupErrorTypeOptions = createOptionsRecord(getLineupErrorTypeOptions());
export const lineupRoleOptions = createOptionsRecord(getLineupRoleOptions());
export const memberFunctionOptions = createOptionsRecord(getMemberFunctionOptions());
export const playerPositionOptions = createOptionsRecord(getPlayerPositionOptions());
export const relationshipStatusOptions = createOptionsRecord(getRelationshipStatusOptions());
export const relationshipTypeOptions = createOptionsRecord(getRelationshipTypeOptions());
export const teamTypesOptions = createOptionsRecord(getTeamTypesOptions());
export const userRolesOptions = createOptionsRecord(getUserRolesOptions());

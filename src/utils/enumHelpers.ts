import {
  getActionTypeOptions,
  getAgeGroupsOptions,
  getAttendanceStatusOptions,
  getAttendanceTabOptions,
  getBlogPostStatusOptions,
  getColumnTypeOptions,
  getCommentTypesOptions,
  getCompetitionTypeOptions,
  getEmptyStateTypeOptions,
  getGenderOptions,
  getLineupCoachRoleOptions,
  getLineupErrorTypeOptions,
  getLineupRoleOptions,
  getMatchStatusOptions,
  getMemberFunctionOptions,
  getModalModeOptions,
  getPlayerPositionOptions,
  getRelationshipStatusOptions,
  getRelationshipTypeOptions,
  getTeamTypesOptions,
  getTodoCategoriesOptions,
  getTodoFilterOptions,
  getTodoPrioritiesOptions,
  getTodoStatusesOptions,
  getTrainingSessionStatusOptions,
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
export const actionTypeOptions = createOptionsRecord(getActionTypeOptions());
export const ageGroupsOptions = createOptionsRecord(getAgeGroupsOptions());
export const attendanceStatusOptions = createOptionsRecord(getAttendanceStatusOptions());
export const attendanceTabOptions = createOptionsRecord(getAttendanceTabOptions());
export const blogPostStatusOptions = createOptionsRecord(getBlogPostStatusOptions());
export const columnTypeOptions = createOptionsRecord(getColumnTypeOptions());
export const commentTypesOptions = createOptionsRecord(getCommentTypesOptions());
export const competitionTypeOptions = createOptionsRecord(getCompetitionTypeOptions());
export const emptyStateTypeOptions = createOptionsRecord(getEmptyStateTypeOptions());
export const genderOptions = createOptionsRecord(getGenderOptions());
export const lineupCoachRoleOptions = createOptionsRecord(getLineupCoachRoleOptions());
export const lineupErrorTypeOptions = createOptionsRecord(getLineupErrorTypeOptions());
export const lineupRoleOptions = createOptionsRecord(getLineupRoleOptions());
export const matchStatusOptions = createOptionsRecord(getMatchStatusOptions());
export const memberFunctionOptions = createOptionsRecord(getMemberFunctionOptions());
export const modalModeOptions = createOptionsRecord(getModalModeOptions());
export const playerPositionOptions = createOptionsRecord(getPlayerPositionOptions());
export const relationshipStatusOptions = createOptionsRecord(getRelationshipStatusOptions());
export const relationshipTypeOptions = createOptionsRecord(getRelationshipTypeOptions());
export const teamTypesOptions = createOptionsRecord(getTeamTypesOptions());
export const todoCategoriesOptions = createOptionsRecord(getTodoCategoriesOptions());
export const todoFilterOptions = createOptionsRecord(getTodoFilterOptions());
export const todoPrioritiesOptions = createOptionsRecord(getTodoPrioritiesOptions());
export const todoStatusesOptions = createOptionsRecord(getTodoStatusesOptions());
export const trainingSessionStatusOptions = createOptionsRecord(getTrainingSessionStatusOptions());
export const userRolesOptions = createOptionsRecord(getUserRolesOptions());

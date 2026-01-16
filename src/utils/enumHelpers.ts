import {
  getActionTypeOptions,
  getAgeGroupsOptions,
  getBlogPostStatusOptions,
  getColumnTypeOptions,
  getCommentTypesOptions,
  getCompetitionTypeOptions,
  getEmptyStateTypeOptions,
  getGenderOptions,
  getLineupCoachRoleOptions,
  getLineupErrorTypeOptions,
  getLineupRoleOptions,
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

// Lazy-initialized option records to avoid circular dependencies
// These are created on first access rather than at module initialization time
let _actionTypeOptions: Record<string, string> | undefined;
let _ageGroupsOptions: Record<string, string> | undefined;
let _blogPostStatusOptions: Record<string, string> | undefined;
let _columnTypeOptions: Record<string, string> | undefined;
let _commentTypesOptions: Record<string, string> | undefined;
let _competitionTypeOptions: Record<string, string> | undefined;
let _emptyStateTypeOptions: Record<string, string> | undefined;
let _genderOptions: Record<string, string> | undefined;
let _lineupCoachRoleOptions: Record<string, string> | undefined;
let _lineupErrorTypeOptions: Record<string, string> | undefined;
let _lineupRoleOptions: Record<string, string> | undefined;
let _memberFunctionOptions: Record<string, string> | undefined;
let _modalModeOptions: Record<string, string> | undefined;
let _playerPositionOptions: Record<string, string> | undefined;
let _relationshipStatusOptions: Record<string, string> | undefined;
let _relationshipTypeOptions: Record<string, string> | undefined;
let _teamTypesOptions: Record<string, string> | undefined;
let _todoCategoriesOptions: Record<string, string> | undefined;
let _todoFilterOptions: Record<string, string> | undefined;
let _todoPrioritiesOptions: Record<string, string> | undefined;
let _todoStatusesOptions: Record<string, string> | undefined;
let _trainingSessionStatusOptions: Record<string, string> | undefined;
let _userRolesOptions: Record<string, string> | undefined;

export const actionTypeOptions = () =>
  (_actionTypeOptions ??= createOptionsRecord(getActionTypeOptions()));
export const ageGroupsOptions = () =>
  (_ageGroupsOptions ??= createOptionsRecord(getAgeGroupsOptions()));
export const blogPostStatusOptions = () =>
  (_blogPostStatusOptions ??= createOptionsRecord(getBlogPostStatusOptions()));
export const columnTypeOptions = () =>
  (_columnTypeOptions ??= createOptionsRecord(getColumnTypeOptions()));
export const commentTypesOptions = () =>
  (_commentTypesOptions ??= createOptionsRecord(getCommentTypesOptions()));
export const competitionTypeOptions = () =>
  (_competitionTypeOptions ??= createOptionsRecord(getCompetitionTypeOptions()));
export const emptyStateTypeOptions = () =>
  (_emptyStateTypeOptions ??= createOptionsRecord(getEmptyStateTypeOptions()));
export const genderOptions = () => (_genderOptions ??= createOptionsRecord(getGenderOptions()));
export const lineupCoachRoleOptions = () =>
  (_lineupCoachRoleOptions ??= createOptionsRecord(getLineupCoachRoleOptions()));
export const lineupErrorTypeOptions = () =>
  (_lineupErrorTypeOptions ??= createOptionsRecord(getLineupErrorTypeOptions()));
export const lineupRoleOptions = () =>
  (_lineupRoleOptions ??= createOptionsRecord(getLineupRoleOptions()));
export const memberFunctionOptions = () =>
  (_memberFunctionOptions ??= createOptionsRecord(getMemberFunctionOptions()));
export const modalModeOptions = () =>
  (_modalModeOptions ??= createOptionsRecord(getModalModeOptions()));
export const playerPositionOptions = () =>
  (_playerPositionOptions ??= createOptionsRecord(getPlayerPositionOptions()));
export const relationshipStatusOptions = () =>
  (_relationshipStatusOptions ??= createOptionsRecord(getRelationshipStatusOptions()));
export const relationshipTypeOptions = () =>
  (_relationshipTypeOptions ??= createOptionsRecord(getRelationshipTypeOptions()));
export const teamTypesOptions = () =>
  (_teamTypesOptions ??= createOptionsRecord(getTeamTypesOptions()));
export const todoCategoriesOptions = () =>
  (_todoCategoriesOptions ??= createOptionsRecord(getTodoCategoriesOptions()));
export const todoFilterOptions = () =>
  (_todoFilterOptions ??= createOptionsRecord(getTodoFilterOptions()));
export const todoPrioritiesOptions = () =>
  (_todoPrioritiesOptions ??= createOptionsRecord(getTodoPrioritiesOptions()));
export const todoStatusesOptions = () =>
  (_todoStatusesOptions ??= createOptionsRecord(getTodoStatusesOptions()));
export const trainingSessionStatusOptions = () =>
  (_trainingSessionStatusOptions ??= createOptionsRecord(getTrainingSessionStatusOptions()));
export const userRolesOptions = () =>
  (_userRolesOptions ??= createOptionsRecord(getUserRolesOptions()));

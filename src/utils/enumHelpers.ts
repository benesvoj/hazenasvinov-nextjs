import {
  getGenderOptions,
  getMemberFunctionOptions,
  getAgeGroupsOptions,
  getCompetitionTypeOptions,
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
export const genderOptions = createOptionsRecord(getGenderOptions());
export const memberFunctionOptions = createOptionsRecord(getMemberFunctionOptions());
export const ageGroupOptions = createOptionsRecord(getAgeGroupsOptions());
export const competitionTypeOptions = createOptionsRecord(getCompetitionTypeOptions());

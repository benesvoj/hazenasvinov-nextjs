import {getAgeGroupsOptions} from '@/enums/getAgeGroupsOptions';
import {getGenderOptions} from '@/enums/getGenderOptions';
import {getTrainingSessionStatusOptions} from '@/enums/getTrainingSessionStatusOptions';
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
export const genderOptions = createOptionsRecord(getGenderOptions());
export const trainingSessionStatusOptions = createOptionsRecord(getTrainingSessionStatusOptions());

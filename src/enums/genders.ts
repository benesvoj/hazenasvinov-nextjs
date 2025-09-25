import {translations} from '@/lib/translations';

const t = translations.common.gender;

export enum Genders {
  MALE = 'male',
  FEMALE = 'female',
  EMPTY = 'empty',
  MIXED = 'mixed',
}

/**
 * Gender display labels
 */
export const GENDER_LABELS: Record<Genders, string> = {
  [Genders.MALE]: t.male,
  [Genders.FEMALE]: t.female,
  [Genders.EMPTY]: t.empty,
  [Genders.MIXED]: t.mixed,
};

/**
 * Get all genders as options for UI
 */
export const getGenderOptions = () =>
  Object.entries(GENDER_LABELS).map(([value, label]) => ({
    value: value as Genders,
    label,
  }));

/**
 * Legacy type for backward compatibility
 * @deprecated Use Genders enum instead
 */
export type GenderType = keyof typeof GENDER_LABELS;

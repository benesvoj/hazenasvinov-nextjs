import {translations} from '@/lib/translations';

export enum Genders {
  MALE = 'male',
  FEMALE = 'female',
  EMPTY = 'empty',
  MIXED = 'mixed',
}

export const GENDER_LABELS: Record<Genders, string> = {
  [Genders.MALE]: translations.common.enums.gender.male,
  [Genders.FEMALE]: translations.common.enums.gender.female,
  [Genders.EMPTY]: translations.common.enums.genderExtended.empty,
  [Genders.MIXED]: translations.common.enums.genderExtended.mixed,
};

export const getGenderOptions = () =>
  Object.entries(GENDER_LABELS).map(([value, label]) => ({
    value: value as Genders,
    label,
  }));

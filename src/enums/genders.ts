import {translations} from '@/lib/translations';

const t = translations.common.gender;

export enum Genders {
  MALE = 'male',
  FEMALE = 'female',
  EMPTY = 'empty',
  MIXED = 'mixed',
}

export const GENDER_LABELS: Record<Genders, string> = {
  [Genders.MALE]: t.male,
  [Genders.FEMALE]: t.female,
  [Genders.EMPTY]: t.empty,
  [Genders.MIXED]: t.mixed,
};

export const getGenderOptions = () =>
  Object.entries(GENDER_LABELS).map(([value, label]) => ({
    value: value as Genders,
    label,
  }));

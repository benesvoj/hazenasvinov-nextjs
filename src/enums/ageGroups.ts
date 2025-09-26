import {translations} from '@/lib/translations';

const t = translations.common.ageGroups;

export enum AgeGroups {
  ADULTS = 'adults',
  JUNIORS = 'juniors',
  YOUTH = 'youth',
  KIDS = 'kids',
}

export const AGE_GROUPS: Record<AgeGroups, string> = {
  [AgeGroups.ADULTS]: t.adults,
  [AgeGroups.JUNIORS]: t.juniors,
  [AgeGroups.YOUTH]: t.youth,
  [AgeGroups.KIDS]: t.kids,
};

export const getAgeGroupsOptions = () =>
  Object.entries(AGE_GROUPS).map(([value, label]) => ({
    value: value as AgeGroups,
    label,
  }));

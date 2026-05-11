import {translations} from '@/lib/translations';

import {Genders} from './genders';

export function genderLabels() {
  return {
    [Genders.MALE]: translations.common.enums.gender.male,
    [Genders.FEMALE]: translations.common.enums.gender.female,
    [Genders.EMPTY]: translations.common.enums.genderExtended.empty,
    [Genders.MIXED]: translations.common.enums.genderExtended.mixed,
  };
}

export const getGenderOptions = () => {
  const labels = genderLabels();

  return Object.entries(labels).map(([value, label]) => ({
    value: value as Genders,
    label,
  }));
};

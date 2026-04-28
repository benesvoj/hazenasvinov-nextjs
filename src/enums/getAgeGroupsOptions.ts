import {AgeGroups} from '@/enums/ageGroups';

import {translations} from '@/lib/translations';

export function getAgeGroupsLabels() {
  return {
    [AgeGroups.ADULTS]: translations.common.enums.ageGroups.adults,
    [AgeGroups.JUNIORS]: translations.common.enums.ageGroups.juniors,
    [AgeGroups.YOUTH]: translations.common.enums.ageGroups.youth,
    [AgeGroups.KIDS]: translations.common.enums.ageGroups.kids,
  };
}

export const getAgeGroupsOptions = () => {
  const labels = getAgeGroupsLabels();

  return Object.entries(labels).map(([value, label]) => ({
    value: value as AgeGroups,
    label,
  }));
};

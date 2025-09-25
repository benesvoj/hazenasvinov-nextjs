import {AgeGroups} from '@/enums';
// Get age group badge color
export const getAgeGroupBadgeColor = (ageGroup: AgeGroups) => {
  switch (ageGroup) {
    case AgeGroups.ADULTS:
      return 'primary';
    case AgeGroups.JUNIORS:
      return 'secondary';
    case AgeGroups.YOUTH:
      return 'success';
    case AgeGroups.KIDS:
      return 'warning';
    default:
      return 'default';
  }
};

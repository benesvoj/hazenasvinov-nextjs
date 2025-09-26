import {Genders} from '@/enums';

export const getGenderBadgeColor = (gender: Genders) => {
  switch (gender) {
    case Genders.MALE:
      return 'primary';
    case Genders.FEMALE:
      return 'secondary';
    case Genders.MIXED:
      return 'success';
    default:
      return 'default';
  }
};

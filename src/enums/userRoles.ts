import {translations} from '@/lib/translations/index';

export enum UserRoles {
  ADMIN = 'admin',
  COACH = 'coach',
  HEAD_COACH = 'head_coach',
  MEMBER = 'member',
}

export const USER_ROLES_LABELS: Record<UserRoles, string> = {
  [UserRoles.ADMIN]: translations.common.userRoles.admin,
  [UserRoles.COACH]: translations.common.userRoles.coach,
  [UserRoles.HEAD_COACH]: translations.common.userRoles.headCoach,
  [UserRoles.MEMBER]: translations.common.userRoles.member,
};

export const getUserRolesOptions = () =>
  Object.entries(USER_ROLES_LABELS).map(([value, label]) => ({
    value: value as UserRoles,
    label,
  }));

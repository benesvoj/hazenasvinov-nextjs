import {translations} from '@/lib/translations';

const t = translations.userRoles;

export enum UserRoles {
  ADMIN = 'admin',
  COACH = 'coach',
  HEAD_COACH = 'head_coach',
  MEMBER = 'member',
}

export const USER_ROLES_LABELS: Record<UserRoles, string> = {
  [UserRoles.ADMIN]: t.admin,
  [UserRoles.COACH]: t.coach,
  [UserRoles.HEAD_COACH]: t.headCoach,
  [UserRoles.MEMBER]: t.member,
};

export const getUserRolesOptions = () =>
  Object.entries(USER_ROLES_LABELS).map(([value, label]) => ({
    value: value as UserRoles,
    label,
  }));

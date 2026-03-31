import {translations} from '@/lib/translations';

import {UserRoles} from '@/shared/auth';

export const USER_ROLES_LABELS: Record<UserRoles, string> = {
  [UserRoles.ADMIN]: translations.common.userRoles.admin,
  [UserRoles.COACH]: translations.common.userRoles.coach,
  [UserRoles.MEMBER]: translations.common.userRoles.member,
};

export const getUserRolesOptions = () =>
  Object.entries(USER_ROLES_LABELS).map(([value, label]) => ({
    value: value as UserRoles,
    label,
  }));

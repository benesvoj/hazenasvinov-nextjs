import {User} from '@supabase/supabase-js';

import {translations} from '@/lib/translations/index';

import {USER_ROLES_LABELS, UserRoles} from '@/enums';

import {userProfileType, variantType} from '../UnifiedTopBar';

const DEFAULT_USER_INITIALS = 'U';
const EMAIL_SEPARATOR = '@';

export const getUserInitials = (user: User | null): string => {
  if (!user?.email) return DEFAULT_USER_INITIALS;

  if (user.user_metadata?.full_name) {
    const names = user.user_metadata.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  }

  const emailParts = user.email.split(EMAIL_SEPARATOR)[0];
  if (emailParts.includes('.')) {
    const parts = emailParts.split('.');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
  }
  return emailParts[0].toUpperCase();
};

export const getDisplayName = (user: User | null): string => {
  if (user?.user_metadata?.full_name) {
    return user.user_metadata.full_name;
  }
  if (user?.email) {
    return user.email.split(EMAIL_SEPARATOR)[0];
  }
  return translations.common.labels.user;
};

export const getRoleDisplay = (
  variant: variantType,
  userProfile: userProfileType | undefined
): string => {
  if (variant === UserRoles.COACH) {
    return userProfile?.role === UserRoles.HEAD_COACH
      ? USER_ROLES_LABELS[UserRoles.HEAD_COACH]
      : USER_ROLES_LABELS[UserRoles.COACH];
  }
  return USER_ROLES_LABELS[UserRoles.ADMIN];
};

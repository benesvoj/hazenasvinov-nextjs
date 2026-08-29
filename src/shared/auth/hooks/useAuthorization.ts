import {PortalVariant} from '@/lib/portal';
import {PORTAL_ACCESS} from '@/lib/portal/portal.config';

import {useUser} from '@/contexts/UserContext';

export function useAuthorization(variant?: PortalVariant) {
  const {isAuthenticated, isAdmin, isCoach, loading} = useUser();

  const roleMap = {
    admin: isAdmin,
    coach: isCoach,
    member: isAuthenticated,
  };

  const hasRoleAccess = !variant ? true : PORTAL_ACCESS[variant].some((role) => roleMap[role]);

  const hasAccess = isAuthenticated && hasRoleAccess;

  return {
    loading,
    isAuthenticated,
    hasAccess,
  };
}

import {UserRoles} from '@/shared/auth/model';

import {PortalVariant} from './portal';

export const PORTAL_ACCESS: Record<PortalVariant, UserRoles[]> = {
  [PortalVariant.ADMIN]: [UserRoles.ADMIN],
  [PortalVariant.COACH]: [UserRoles.COACH, UserRoles.ADMIN],
};

import {UserRoles} from '@/shared/auth';

import {PortalVariant} from './portal';

export function resolvePortalType(role: UserRoles): PortalVariant {
  if (role === UserRoles.ADMIN) return PortalVariant.ADMIN;
  return PortalVariant.COACH;
}

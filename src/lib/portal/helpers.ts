import {PortalVariant} from './portal';

export function isAdminPortal(variant: PortalVariant) {
  return variant === PortalVariant.ADMIN;
}

export function isCoachPortal(variant: PortalVariant) {
  return variant === PortalVariant.COACH;
}

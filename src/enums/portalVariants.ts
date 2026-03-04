import {translations} from '@/lib/translations';

export enum PortalVariants {
  ADMIN = 'admin',
  COACH = 'coach',
}

export const PORTAL_VARIANT_LABELS: Record<PortalVariants, string> = {
  [PortalVariants.ADMIN]: translations.common.portals.admin,
  [PortalVariants.COACH]: translations.common.portals.coach,
};

export const getPortalVariantsOptions = () =>
  Object.entries(PORTAL_VARIANT_LABELS).map(([value, label]) => ({
    value: value as PortalVariants,
    label,
  }));

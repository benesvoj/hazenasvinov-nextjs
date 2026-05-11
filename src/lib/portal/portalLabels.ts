import {commonCopy} from '@/shared/copy';

import {PortalVariant} from './portal';

export const PORTAL_VARIANT_LABELS: Record<PortalVariant, string> = {
  [PortalVariant.ADMIN]: commonCopy.portal.admin,
  [PortalVariant.COACH]: commonCopy.portal.coach,
};

export const getPortalVariantsOptions = () =>
  Object.entries(PORTAL_VARIANT_LABELS).map(([value, label]) => ({
    value: value as PortalVariant,
    label,
  }));

import {UserRoles} from '@/enums';

import {variantType} from '../UnifiedTopBar';

interface SidebarState {
  isMobile?: boolean;
  isCollapsed?: boolean;
}

export const VARIANT_CONFIG = {
  [UserRoles.ADMIN]: {zIndex: 'z-40', contentClass: 'h-full px-3 sm:px-4 xl:px-6'},
  [UserRoles.COACH]: {zIndex: 'z-30', contentClass: 'px-3 sm:px-4 py-3'},
};

const BASE_HEADER =
  'fixed top-0 right-0 bg-white md:h-20 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 ease-in-out';

export const getHeaderClasses = (variant: variantType, sidebar?: SidebarState): string => {
  const {zIndex} = VARIANT_CONFIG[variant];
  const leftClass = sidebar?.isMobile ? 'left-0' : sidebar?.isCollapsed ? 'left-16' : 'left-56';
  return `${BASE_HEADER} ${zIndex} ${leftClass}`;
};

export const getContentClasses = (variant: UserRoles.ADMIN | UserRoles.COACH): string => {
  const {contentClass} = VARIANT_CONFIG[variant];
  return `flex items-center justify-between min-w-0 ${contentClass}`;
};

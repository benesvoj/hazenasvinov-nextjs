'use client';

import React from 'react';

import {usePathname} from 'next/navigation';

import {findRouteByPath} from '@/lib/navigation';

import {UnifiedTopBar} from '@/components';
import {UserRoles} from '@/enums';

import {useAdminSidebar} from './AdminSidebarContext';

export const AdminTopBar = () => {
  const pathname = usePathname();
  const {isCollapsed, isMobileOpen, setIsMobileOpen, isMobile} = useAdminSidebar();
  const currentSection = findRouteByPath(pathname);

  return (
    <UnifiedTopBar
      variant={UserRoles.ADMIN}
      sidebarContext={{
        isCollapsed,
        isMobileOpen,
        setIsMobileOpen,
        isMobile,
      }}
      pageTitle={currentSection?.title}
      pageDescription={currentSection?.description}
    />
  );
};

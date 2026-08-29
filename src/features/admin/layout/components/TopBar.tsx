'use client';

import React from 'react';

import {usePathname} from 'next/navigation';

import {findRouteByPath} from '@/lib/navigation';
import {PortalVariant} from '@/lib/portal';

import {UnifiedTopBar} from '@/components';

import {useAdminSidebar} from '../../providers';

export const TopBar = () => {
  const pathname = usePathname();
  const {isCollapsed, isMobileOpen, setIsMobileOpen, isMobile} = useAdminSidebar();
  const currentSection = findRouteByPath(pathname);

  return (
    <UnifiedTopBar
      variant={PortalVariant.ADMIN}
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

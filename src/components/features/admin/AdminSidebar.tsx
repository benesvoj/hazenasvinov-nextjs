'use client';

import React from 'react';

import {UnifiedSidebar} from '@/components';
import {PortalVariants} from '@/enums';

import {useAdminSidebar} from './AdminSidebarContext';

export const AdminSidebar = () => {
  const sidebarContext = useAdminSidebar();

  return (
    <UnifiedSidebar
      variant={PortalVariants.ADMIN}
      sidebarContext={{
        isCollapsed: sidebarContext.isCollapsed,
        isMobileOpen: sidebarContext.isMobileOpen,
        setIsMobileOpen: sidebarContext.setIsMobileOpen,
        isMobile: sidebarContext.isMobile,
        toggleSidebar: () => sidebarContext.setIsCollapsed(!sidebarContext.isCollapsed),
      }}
    />
  );
};

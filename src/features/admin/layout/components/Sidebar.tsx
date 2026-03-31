'use client';

import React from 'react';

import {PortalVariant} from '@/lib/portal';

import {UnifiedSidebar} from '@/components';

import {useAdminSidebar} from '../../providers';

export const Sidebar = () => {
  const sidebarContext = useAdminSidebar();

  return (
    <UnifiedSidebar
      variant={PortalVariant.ADMIN}
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

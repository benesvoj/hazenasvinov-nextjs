'use client';

import React from 'react';

import {PortalVariant} from '@/lib/portal';

import {UnifiedSidebar} from '@/components';

import {useCoachesSidebar} from '../../providers';

export const Sidebar = () => {
  const sidebarContext = useCoachesSidebar();

  return (
    <UnifiedSidebar
      variant={PortalVariant.COACH}
      sidebarContext={{
        isCollapsed: sidebarContext.isCollapsed,
        isMobileOpen: sidebarContext.isMobileOpen,
        setIsMobileOpen: sidebarContext.setIsMobileOpen,
        isMobile: sidebarContext.isMobile,
        toggleSidebar: sidebarContext.toggleSidebar,
      }}
    />
  );
};

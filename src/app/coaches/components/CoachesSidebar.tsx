'use client';

import React from 'react';

import {UnifiedSidebar} from '@/components';

import {useCoachesSidebar} from './CoachesSidebarContext';

export const CoachesSidebar = () => {
  const sidebarContext = useCoachesSidebar();

  return (
    <UnifiedSidebar
      variant="coach"
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

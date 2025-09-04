'use client';

import React from "react";
import { UnifiedSidebar } from "@/components";
import { useSidebar } from "./SidebarContext";

export const AdminSidebar = () => {
  const sidebarContext = useSidebar();

  return (
    <UnifiedSidebar
      variant="admin"
      sidebarContext={{
        isCollapsed: sidebarContext.isCollapsed,
        isMobileOpen: sidebarContext.isMobileOpen,
        setIsMobileOpen: sidebarContext.setIsMobileOpen,
        isMobile: sidebarContext.isMobile,
        toggleSidebar: () => sidebarContext.setIsCollapsed(!sidebarContext.isCollapsed)
      }}
    />
  );
};

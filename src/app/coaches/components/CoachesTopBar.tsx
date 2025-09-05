'use client';

import React from "react";
import { usePathname } from "next/navigation";
import { useCoachesSidebar } from "./CoachesSidebarContext";
import { useUser } from "@/contexts/UserContext";
import { UnifiedTopBar } from "@/components";

const getPageTitle = (pathname: string) => {
  switch (pathname) {
    case '/coaches/dashboard':
      return 'Dashboard';
    case '/coaches/teams':
      return 'Moje týmy';
    case '/coaches/videos':
      return 'Videa';
    case '/coaches/statistics':
      return 'Statistiky';
    case '/coaches/meeting-minutes':
      return 'Zápisy ze schůzí';
    default:
      return 'Trenérský Portal';
  }
};

export const CoachesTopBar = () => {
  const pathname = usePathname();
  const { toggleSidebar, isCollapsed, isMobileOpen, setIsMobileOpen, isMobile } = useCoachesSidebar();
  const { user, userProfile } = useUser();

  return (
    <UnifiedTopBar
      variant="coach"
      sidebarContext={{
        isCollapsed,
        isMobileOpen,
        setIsMobileOpen,
        isMobile,
        toggleSidebar
      }}
      pageTitle={getPageTitle(pathname)}
      userProfile={userProfile || undefined}
    />
  );
};

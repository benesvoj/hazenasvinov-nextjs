'use client';

import React from 'react';

import {usePathname} from 'next/navigation';

import {coachesNavRoutes} from '@/lib/navigation';
import {translations} from '@/lib/translations';

import {useUser} from '@/contexts/UserContext';

import {UnifiedTopBar} from '@/components';
import {UserRoles} from '@/enums';

import {useCoachesSidebar} from './CoachesSidebarContext';

const getPageInfo = (pathname: string) => {
  // Find the route that matches the current pathname
  const route = coachesNavRoutes.find((route) => route.href === pathname);

  if (route) {
    // Get the route key from the href (e.g., 'dashboard' from '/coaches/dashboard')
    const routeKey = route.href.replace(
      '/coaches/',
      ''
    ) as keyof typeof translations.coachPortal.routes;
    const descriptionKey = routeKey as keyof typeof translations.coachPortal.descriptions;

    return {
      title: translations.coachPortal.routes[routeKey],
      description: translations.coachPortal.descriptions[descriptionKey],
    };
  }

  // Fallback for unknown routes
  return {
    title: translations.coachPortal.title,
    description: translations.coachPortal.description || '',
  };
};

export const CoachesTopBar = () => {
  const pathname = usePathname();
  const {toggleSidebar, isCollapsed, isMobileOpen, setIsMobileOpen, isMobile} = useCoachesSidebar();
  const {user, userProfile} = useUser();

  const pageInfo = getPageInfo(pathname);

  return (
    <UnifiedTopBar
      variant={UserRoles.COACH}
      sidebarContext={{
        isCollapsed,
        isMobileOpen,
        setIsMobileOpen,
        isMobile,
        toggleSidebar,
      }}
      pageTitle={pageInfo.title?.toString()}
      pageDescription={pageInfo.description?.toString()}
      userProfile={userProfile || undefined}
    />
  );
};

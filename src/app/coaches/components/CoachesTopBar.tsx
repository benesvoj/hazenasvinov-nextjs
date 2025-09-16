'use client';

import React from 'react';
import {usePathname} from 'next/navigation';
import {useCoachesSidebar} from './CoachesSidebarContext';
import {useUser} from '@/contexts/UserContext';
import {UnifiedTopBar} from '@/components';
import {coachesRoutes} from '../routes/routes';
import {translations} from '@/lib/translations';

const getPageInfo = (pathname: string) => {
  // Find the route that matches the current pathname
  const route = coachesRoutes.find((route) => route.href === pathname);

  if (route) {
    // Get the route key from the href (e.g., 'dashboard' from '/coaches/dashboard')
    const routeKey = route.href.replace(
      '/coaches/',
      ''
    ) as keyof typeof translations.coaches.routes;
    const descriptionKey = routeKey as keyof typeof translations.coaches.descriptions;

    return {
      title: translations.coaches.routes[routeKey],
      description: translations.coaches.descriptions[descriptionKey],
    };
  }

  // Fallback for unknown routes
  return {
    title: translations.coaches.title,
    description: translations.coaches.description,
  };
};

export const CoachesTopBar = () => {
  const pathname = usePathname();
  const {toggleSidebar, isCollapsed, isMobileOpen, setIsMobileOpen, isMobile} = useCoachesSidebar();
  const {user, userProfile} = useUser();

  const pageInfo = getPageInfo(pathname);

  return (
    <UnifiedTopBar
      variant="coach"
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

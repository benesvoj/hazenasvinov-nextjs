'use client';

import React from 'react';

import {usePathname} from 'next/navigation';

import {APP_ROUTES} from '@/lib/app-routes';
import {PortalVariant} from '@/lib/portal';

import {
  CoachCategoryProvider,
  Sidebar,
  CoachSidebarProvider,
  TopBar,
  useCoachesSidebar,
} from '@/features/coach';
import {ProtectedRoute} from '@/shared/auth';
import {PortalLayout} from '@/shared/components';

export default function CoachLayout({children}: {children: React.ReactNode}) {
  const pathname = usePathname();

  // Don't show sidebar and top bar on login page
  if (pathname === APP_ROUTES.coaches.login) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute variant={PortalVariant.COACH}>
      <CoachSidebarProvider>
        <CoachCategoryProvider>
          <PortalLayout
            sidebar={<Sidebar />}
            topbar={<TopBar />}
            variant={PortalVariant.COACH}
            useSidebar={useCoachesSidebar}
          >
            {children}
          </PortalLayout>
        </CoachCategoryProvider>
      </CoachSidebarProvider>
    </ProtectedRoute>
  );
}

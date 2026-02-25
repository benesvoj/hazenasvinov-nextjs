'use client';

import React from 'react';

import {usePathname} from 'next/navigation';

import ProtectedCoachRoute from '@/components/routes/ProtectedCoachRoute';

import {
  CoachesSidebar,
  CoachesSidebarProvider,
  CoachesTopBar,
  useCoachesSidebar,
} from '@/app/coaches/components';
import {CoachCategoryProvider} from '@/app/coaches/components/CoachCategoryContext';

function CoachesLayoutContent({children}: {children: React.ReactNode}) {
  const sidebarContext = useCoachesSidebar();
  const isCollapsed = sidebarContext?.isCollapsed || false;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <CoachesSidebar />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out w-full ${
          isCollapsed ? 'lg:ml-16' : 'lg:ml-56'
        }`}
      >
        <CoachesTopBar />
        <main className="pt-16 p-2 sm:p-3">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function CoachesLayout({children}: {children: React.ReactNode}) {
  const pathname = usePathname();

  // Don't show sidebar and top bar on login page
  if (pathname === '/coaches/login') {
    return <>{children}</>;
  }

  return (
    <ProtectedCoachRoute>
      <CoachesSidebarProvider>
        <CoachCategoryProvider>
          <CoachesLayoutContent>{children}</CoachesLayoutContent>
        </CoachCategoryProvider>
      </CoachesSidebarProvider>
    </ProtectedCoachRoute>
  );
}

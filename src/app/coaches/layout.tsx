'use client';

import React from 'react';
import {usePathname} from 'next/navigation';
import {
  CoachesTopBar,
  CoachesSidebarProvider,
  CoachesSidebar,
  useCoachesSidebar,
} from '@/app/coaches/components';
import ProtectedCoachRoute from '@/components/ProtectedCoachRoute';

function CoachesLayoutContent({children}: {children: React.ReactNode}) {
  const sidebarContext = useCoachesSidebar();
  const isCollapsed = sidebarContext?.isCollapsed || false;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <CoachesSidebar />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out w-full ${
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        <CoachesTopBar />
        <main className="pt-16 p-3 sm:p-4">
          <div className="max-w-7xl mx-auto">{children}</div>
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
        <CoachesLayoutContent>{children}</CoachesLayoutContent>
      </CoachesSidebarProvider>
    </ProtectedCoachRoute>
  );
}

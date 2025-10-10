'use client';

import React from 'react';

import {
  AdminTopBar,
  AdminSidebar,
  AdminSidebarContext,
  useAdminSidebar,
} from '@/components/features/admin';

import {AdminCategorySimulationProvider} from '@/contexts/AdminCategorySimulationContext';

import {ProtectedRoute} from '@/components';

function AdminMainContent({children}: {children: React.ReactNode}) {
  const {isCollapsed, isMobile} = useAdminSidebar();

  return (
    <div
      className={`flex-1 transition-all duration-300 ease-in-out w-full ${
        isMobile ? 'ml-0' : isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}
    >
      <AdminTopBar />
      <main className="pt-4 p-3 sm:p-4 lg:p-6 mt-20">
        <div className={`max-w-7xl ${isMobile ? 'ml-0' : 'ml-4'}`}>{children}</div>
      </main>
    </div>
  );
}

export default function AdminLayout({children}: {children: React.ReactNode}) {
  return (
    <ProtectedRoute>
      <AdminCategorySimulationProvider>
        <AdminSidebarContext>
          <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <AdminSidebar />
            <AdminMainContent>{children}</AdminMainContent>
          </div>
        </AdminSidebarContext>
      </AdminCategorySimulationProvider>
    </ProtectedRoute>
  );
}

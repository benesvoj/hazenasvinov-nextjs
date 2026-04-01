'use client';

import {ReactNode} from 'react';

import {PortalVariant} from '@/lib/portal';

import {
  AdminCategorySimulationProvider,
  Sidebar,
  AdminSidebarProvider,
  TopBar,
  useAdminSidebar,
} from '@/features/admin';
import {ProtectedRoute} from '@/shared/auth';
import {PortalLayout} from '@/shared/components';

export default function AdminLayout({children}: {children: ReactNode}) {
  return (
    <ProtectedRoute variant={PortalVariant.ADMIN}>
      <AdminCategorySimulationProvider>
        <AdminSidebarProvider>
          <PortalLayout
            sidebar={<Sidebar />}
            topbar={<TopBar />}
            variant={PortalVariant.ADMIN}
            useSidebar={useAdminSidebar}
          >
            {children}
          </PortalLayout>
        </AdminSidebarProvider>
      </AdminCategorySimulationProvider>
    </ProtectedRoute>
  );
}

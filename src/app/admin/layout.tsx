'use client';

import React from "react";
// import { Sidebar } from "@/app/admin/components/Sidebar";
import { SidebarProvider } from "@/app/admin/components/SidebarContext";
import { ProtectedRoute } from "@/components";
import { AdminTopBar, AdminSidebar } from '@/app/admin/components';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* <Sidebar /> */}
          <AdminSidebar />
          <div className="flex-1 transition-all duration-300 ease-in-out w-full lg:ml-64">
            <AdminTopBar />
            <main className="pt-18 p-3 sm:p-4 lg:p-6 mt-20">
              <div className="max-w-7xl ml-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}

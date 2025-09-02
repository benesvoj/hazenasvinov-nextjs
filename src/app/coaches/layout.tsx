'use client';

import React from "react";
import { CoachesSidebar, CoachesTopBar, CoachesSidebarProvider } from "@/app/coaches/components";
import ProtectedCoachRoute from "@/components/ProtectedCoachRoute";

export default function CoachesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedCoachRoute>
      <CoachesSidebarProvider>
        <div className="flex min-h-screen bg-gray-50">
          <CoachesSidebar />
          <div className="flex-1 transition-all duration-300 ease-in-out w-full lg:ml-64">
            <CoachesTopBar />
            <main className="pt-16 p-3 sm:p-4 lg:p-6 mt-16">
              <div className="max-w-7xl ml-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </CoachesSidebarProvider>
    </ProtectedCoachRoute>
  );
}
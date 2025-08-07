'use client';

import React from "react";
import { Sidebar } from "@/app/admin/components/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-6 transition-all duration-300 ease-in-out lg:ml-64 md:ml-16 sm:ml-0">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

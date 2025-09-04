'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCoachesSidebar } from "./CoachesSidebarContext";
import { 
  AcademicCapIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { coachesRoutes } from "../routes/routes";

export function CoachesSidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useCoachesSidebar();

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full bg-white shadow-lg transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        lg:translate-x-0
        ${isCollapsed ? '-translate-x-full' : 'translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <AcademicCapIcon className="w-8 h-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">Trenérský Portal</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <ul className="space-y-2">
            {coachesRoutes.map((route) => {
              const isActive = pathname === route.href;
              const Icon = route.icon;
              
              return (
                <li key={route.name}>
                  <Link
                    href={route.href}
                    className={`
                      flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-green-100 text-green-700 border-r-2 border-green-600' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                    {!isCollapsed && <span>{route.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="text-xs text-gray-500 text-center">
              TJ Sokol Svinov
            </div>
          </div>
        )}
      </div>
    </>
  );
}

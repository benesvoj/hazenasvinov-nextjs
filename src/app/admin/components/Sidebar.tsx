'use client';

import React from "react";
import { translations } from "@/lib/translations";
import Link from "next/link";
import { usePathname } from "next/navigation";
import routes, { privateRoutes } from "@/routes/routes";
import { useSidebar } from "./SidebarContext";
import { 
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  TrophyIcon,
  UsersIcon,
  Cog6ToothIcon,
  CogIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  UserIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  HeartIcon,
  TagIcon,
  PhotoIcon,
  VideoCameraIcon,
  ShieldCheckIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

// Icon mapping for admin routes
const getRouteIcon = (route: string) => {
  switch (route) {
    case privateRoutes.admin:
      return <HomeIcon className="w-5 h-5" />;
    case privateRoutes.users:
      return <UsersIcon className="w-5 h-5" />;
    case privateRoutes.posts:
      return <DocumentTextIcon className="w-5 h-5" />;
    case privateRoutes.categories:
      return <TagIcon className="w-5 h-5" />;
    case privateRoutes.seasons:
      return <CalendarIcon className="w-5 h-5" />;
    case privateRoutes.teams:
      return <UserGroupIcon className="w-5 h-5" />;
    case privateRoutes.teamCategories:
      return <BuildingOfficeIcon className="w-5 h-5" />;
    case privateRoutes.matches:
      return <TrophyIcon className="w-5 h-5" />;
    case privateRoutes.members:
      return <UsersIcon className="w-5 h-5" />;
    case privateRoutes.memberFunctions:
      return <CogIcon className="w-5 h-5" />;
    case privateRoutes.committees:
      return <BuildingOfficeIcon className="w-5 h-5" />;
    case privateRoutes.competitions:
      return <TrophyIcon className="w-5 h-5" />;
    case privateRoutes.sponsorship:
      return <HeartIcon className="w-5 h-5" />;
    case privateRoutes.clubConfig:
      return <Cog6ToothIcon className="w-5 h-5" />;
    case privateRoutes.photoGallery:
      return <PhotoIcon className="w-5 h-5" />;
    case privateRoutes.clubs:
      return <BuildingOfficeIcon className="w-5 h-5" />;
    case privateRoutes.clubCategories:
      return <BuildingOfficeIcon className="w-5 h-5" />;
    case privateRoutes.videos:
      return <VideoCameraIcon className="w-5 h-5" />;
    case privateRoutes.userRoles:
      return <ShieldCheckIcon className="w-5 h-5" />;
    default:
      return <Cog6ToothIcon className="w-5 h-5" />;
  }
};

export const Sidebar = () => {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen, isMobile } = useSidebar();

  const items = routes.filter((item) => item.isPrivate === true && !item.hidden);

  const handleNavClick = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  // Mobile overlay
  if (isMobile && isMobileOpen) {
    return (
      <>
        {/* Mobile overlay */}
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
        
        {/* Mobile sidebar */}
        <aside className="fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white w-80 max-w-[85vw] z-50 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrophyIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">{translations.admin.title}</h1>
                <p className="text-xs text-gray-400">Administrace</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-200 hover:scale-105"
              title="Zavřít menu"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 admin-sidebar-nav py-4" style={{ minHeight: 0, maxHeight: 'calc(100vh - 200px)' }}>
            <div className="space-y-2 px-3">
              {items.map((item) => {
                const isActive = pathname === item.route;
                const icon = getRouteIcon(item.route || '');
                
                return (
                  <Link
                    key={item.route}
                    href={item.route || privateRoutes.admin}
                    onClick={handleNavClick}
                    className={`group flex items-center px-3 py-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg transform scale-105'
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:transform hover:scale-105'
                    }`}
                  >
                    {/* Active background glow */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-500/20 rounded-xl"></div>
                    )}
                    
                    <div className="flex items-center relative z-10 space-x-3">
                      <div className={`flex-shrink-0 p-1 rounded-lg transition-all duration-200 ${
                        isActive 
                          ? 'text-white bg-white/20' 
                          : 'text-gray-400 group-hover:text-white group-hover:bg-gray-600/30'
                      }`}>
                        {icon}
                      </div>
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute right-3 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Mobile Footer */}
          <div className="p-4 border-t border-gray-700 bg-gray-800/30">
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">TJ Sokol Svinov</div>
              <div className="text-xs text-gray-500">Administrace</div>
            </div>
          </div>
        </aside>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white transition-all duration-300 ease-in-out z-50 shadow-xl hidden lg:block flex flex-col ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrophyIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{translations.admin.title}</h1>
              <p className="text-xs text-gray-400">Administrace</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-200 hover:scale-105"
          title={isCollapsed ? "Rozbalit menu" : "Sbalit menu"}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 admin-sidebar-nav py-4" style={{ minHeight: 0, maxHeight: 'calc(100vh - 200px)' }}>
        <div className="space-y-2 px-3">
          {items.map((item) => {
            const isActive = pathname === item.route;
            const icon = getRouteIcon(item.route || '');
            
            return (
              <Link
                key={item.route}
                href={item.route || privateRoutes.admin}
                className={`group flex items-center px-3 py-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:transform hover:scale-105'
                }`}
                title={isCollapsed ? item.title : undefined}
              >
                {/* Active background glow */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-500/20 rounded-xl"></div>
                )}
                
                <div className={`flex items-center relative z-10 ${isCollapsed ? 'justify-center w-full' : 'space-x-3'}`}>
                  <div className={`flex-shrink-0 p-1 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'text-white bg-white/20' 
                      : 'text-gray-400 group-hover:text-white group-hover:bg-gray-600/30'
                  }`}>
                    {icon}
                  </div>
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.title}</span>
                  )}
                </div>
                
                {/* Active indicator */}
                {isActive && !isCollapsed && (
                  <div className="absolute right-3 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-700 bg-gray-800/30">
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">TJ Sokol Svinov</div>
            <div className="text-xs text-gray-500">Administrace</div>
          </div>
        </div>
      )}
    </aside>
  );
};
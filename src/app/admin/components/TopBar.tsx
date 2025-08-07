'use client';

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import routes, { privateRoutes } from "@/routes/routes";
import { useSidebar } from "./SidebarContext";
import { 
  UserIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  InformationCircleIcon,
  Cog6ToothIcon
} from "@heroicons/react/24/outline";
import { 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem,
  Button,
  Badge
} from "@heroui/react";

// Get current section info based on pathname
const getCurrentSection = (pathname: string) => {
  const currentRoute = routes.find(route => route.route === pathname);
  
  if (currentRoute) {
    return {
      title: currentRoute.title,
      description: currentRoute.description || ''
    };
  }
  
  // Fallback for dynamic routes
  if (pathname.includes('/admin/teams')) {
    return { title: 'Týmy', description: 'Správa týmů a jejich informací.' };
  }
  if (pathname.includes('/admin/matches')) {
    return { title: 'Zápasy', description: 'Správa zápasů, výsledků a tabulek pro všechny kategorie.' };
  }
  if (pathname.includes('/admin/members')) {
    return { title: 'Členové', description: 'Správa členů klubu - přidávání, úprava a mazání členů.' };
  }
  if (pathname.includes('/admin/seasons')) {
    return { title: 'Sezóny', description: 'Správa sezón pro organizaci soutěží a týmů.' };
  }
  if (pathname.includes('/admin/categories')) {
    return { title: 'Kategorie', description: 'Správa kategorií pro týmové soutěže a členy klubu.' };
  }
  if (pathname.includes('/admin/users')) {
    return { title: 'Uživatelé', description: 'Správa uživatelů, kteří se mohou přihlásit do systému.' };
  }
  
  return { title: 'Dashboard', description: 'Správa obsahu a nastavení systému.' };
};

export const TopBar = () => {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const [notifications, setNotifications] = useState(3); // Mock notification count
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  
  const currentSection = getCurrentSection(pathname);

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log('Logout clicked');
  };

  const handleReleaseNotes = () => {
    setShowReleaseNotes(!showReleaseNotes);
  };

  return (
    <div className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-200 shadow-sm z-40 transition-all duration-300 ease-in-out ${
      isCollapsed ? 'left-16' : 'left-64'
    }`}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side - Section info */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{currentSection.title}</h1>
            {currentSection.description && (
              <p className="text-sm text-gray-600 mt-1">{currentSection.description}</p>
            )}
          </div>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center space-x-4">
          {/* Release Notes Button */}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className="relative"
            onPress={handleReleaseNotes}
            title="Release Notes"
          >
            <InformationCircleIcon className="w-5 h-5 text-gray-600" />
            {notifications > 0 && (
              <Badge 
                color="danger" 
                size="sm"
                className="absolute -top-1 -right-1"
              >
                {notifications}
              </Badge>
            )}
          </Button>

          {/* Notifications */}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className="relative"
            title="Notifikace"
          >
            <BellIcon className="w-5 h-5 text-gray-600" />
            {notifications > 0 && (
              <Badge 
                color="danger" 
                size="sm"
                className="absolute -top-1 -right-1"
              >
                {notifications}
              </Badge>
            )}
          </Button>

          {/* Settings */}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            title="Nastavení"
          >
            <Cog6ToothIcon className="w-5 h-5 text-gray-600" />
          </Button>

          {/* User Profile Dropdown */}
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                variant="light"
                className="flex items-center space-x-2 px-3 py-2"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">admin@sokol-svinov.cz</p>
                </div>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User actions">
              <DropdownItem key="profile">
                <div className="flex items-center space-x-2">
                  <UserIcon className="w-4 h-4" />
                  <span>Profil</span>
                </div>
              </DropdownItem>
              <DropdownItem key="settings">
                <div className="flex items-center space-x-2">
                  <Cog6ToothIcon className="w-4 h-4" />
                  <span>Nastavení</span>
                </div>
              </DropdownItem>
              <DropdownItem key="logout" color="danger" onPress={handleLogout}>
                <div className="flex items-center space-x-2">
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span>Odhlásit</span>
                </div>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Release Notes Modal */}
      {showReleaseNotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Release Notes</h2>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={() => setShowReleaseNotes(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-900">v2.1.0 - 2024-01-15</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>• Přidána správa sezón s možností uzavření</li>
                    <li>• Vylepšená správa kategorií týmů</li>
                    <li>• Nový design sidebar menu</li>
                    <li>• Opravy v databázovém schématu</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-gray-900">v2.0.0 - 2024-01-10</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>• Kompletní redesign administrace</li>
                    <li>• Nový systém správy zápasů</li>
                    <li>• Vylepšená správa týmů</li>
                    <li>• Přidána správa členů</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-gray-400 pl-4">
                  <h3 className="font-semibold text-gray-900">v1.0.0 - 2024-01-01</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>• První verze systému</li>
                    <li>• Základní správa obsahu</li>
                    <li>• Autentizace uživatelů</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

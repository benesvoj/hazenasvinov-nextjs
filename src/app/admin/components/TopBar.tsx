'use client';

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import routes, { privateRoutes } from "@/routes/routes";
import { useSidebar } from "./SidebarContext";
import { 
  UserIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import { 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem,
  Button,
  Badge,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody
} from "@heroui/react";
import { ReleaseNote, getReleaseNotes } from "@/utils/releaseNotes";

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
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);
  
  const currentSection = getCurrentSection(pathname);

  useEffect(() => {
    loadReleaseNotes();
  }, []);

  const loadReleaseNotes = () => {
    try {
      const notes = getReleaseNotes();
      setReleaseNotes(notes);
    } catch (error) {
      console.error('Error loading release notes:', error);
      setReleaseNotes([]);
    }
  };

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
            <DocumentTextIcon className="w-5 h-5 text-gray-600" />
            {releaseNotes.length > 0 && (
              <Badge 
                color="primary" 
                size="sm"
                className="absolute -top-1 -right-1"
              >
                {releaseNotes.length}
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
      <Modal 
        isOpen={showReleaseNotes} 
        onClose={() => setShowReleaseNotes(false)} 
        size="4xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-h-[90vh] overflow-hidden",
          wrapper: "items-center justify-center p-4",
          body: "max-h-[70vh] overflow-y-auto"
        }}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-blue-500" />
              <span>Release Notes</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {releaseNotes.map((release, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Version {release.version}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {release.date}
                      </p>
                    </div>
                    {index === 0 && (
                      <Badge color="success" variant="flat">
                        Current
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {release.features.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          🚀 New Features
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {release.features.map((feature, idx) => (
                            <li key={idx}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {release.improvements.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          🔧 Improvements
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {release.improvements.map((improvement, idx) => (
                            <li key={idx}>{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {release.bugFixes.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          🐛 Bug Fixes
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {release.bugFixes.map((bugFix, idx) => (
                            <li key={idx}>{bugFix}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {release.technicalUpdates.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          📋 Technical Updates
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {release.technicalUpdates.map((update, idx) => (
                            <li key={idx}>{update}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

// Deprecated - use AdminTopBar instead
'use client';

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import routes from "@/routes/routes";
import { useSidebar } from "./SidebarContext";
import { useAuth } from "@/hooks/useAuth";
import { usePortalAccess } from "@/hooks/usePortalAccess";
import { logLogout } from "@/utils/loginLogger";
import { 
  UserIcon,
  ArrowRightEndOnRectangleIcon,
  BellIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  Bars3Icon,
  AcademicCapIcon
} from "@heroicons/react/24/outline";
import { 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem,
  Button,
  Badge,
  Avatar,
} from "@heroui/react";
import { ReleaseNote, getReleaseNotes } from "@/utils/releaseNotes";
import { ReleaseNotesModal, UserProfileModal } from "@/components";

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
  const { isCollapsed, isMobileOpen, setIsMobileOpen, isMobile } = useSidebar();
  const { user, signOut } = useAuth();
  const { hasCoachAccess, hasBothAccess,hasAdminAccess } = usePortalAccess();
  const [notifications, setNotifications] = useState(3); // Mock notification count
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
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

  const handleLogout = async () => {
    try {
      // Log the logout if we have user information
      if (user?.email) {
        try {
          await logLogout(user.email);
        } catch (logError) {
          console.error('Failed to log logout:', logError);
          // Don't block logout if logging fails
        }
      }
      
      await signOut();
      // Redirect will be handled by the auth hook
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleReleaseNotes = () => {
    setShowReleaseNotes(!showReleaseNotes);
  };

  const handleSwitchToCoachPortal = () => {
    window.location.href = '/coaches/dashboard';
  };

  const handleProfileOpen = () => {
    setShowProfileDialog(true);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    
    // Try to get name from user metadata first
    if (user.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    
    // Fallback to email initials
    const emailParts = user.email.split('@')[0];
    if (emailParts.includes('.')) {
      const parts = emailParts.split('.');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
    }
    return emailParts[0].toUpperCase();
  };

  // Get display name
  const getDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Uživatel';
  };

  return (
    <div className={`fixed top-0 right-0 bg-white h-20 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-40 transition-all duration-300 ease-in-out ${
      isMobile ? 'left-0' : isCollapsed ? 'left-16' : 'left-64'
    }`}>
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Left side - Mobile menu button and Section info */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Mobile menu button */}
          {isMobile && (
            <Button
              isIconOnly
              variant="light"
              size="sm"
              className="lg:hidden"
              onPress={() => setIsMobileOpen(true)}
              title="Otevřít menu"
            >
              <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Button>
          )}
          
          {/* Section info */}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
              {currentSection.title}
            </h1>
            {currentSection.description && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 hidden sm:block">
                {currentSection.description}
              </p>
            )}
          </div>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Release Notes Button - Hidden on very small screens */}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className="relative hidden sm:flex"
            onPress={handleReleaseNotes}
            title="Release Notes"
          >
            <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {releaseNotes.length > 0 && (
              <Badge 
                color="primary" 
                size="sm"
              >
                {releaseNotes.length}
              </Badge>
            )}
          </Button>

          {/* Notifications - Hidden on very small screens */}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className="relative hidden sm:flex"
            title="Notifikace"
          >
            <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
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

          {/* User Profile Dropdown */}
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                variant="light"
                className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <Avatar
                  name={getUserInitials()}
                  className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-medium"
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{getDisplayName()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'Načítání...'}</p>
                </div>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User actions">
              <DropdownItem key="profile-header" className="py-3" onPress={handleProfileOpen}>
                <div className="flex items-center space-x-3">
                  <Avatar
                    name={getUserInitials()}
                    className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-base font-medium"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{getDisplayName()}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                </div>
              </DropdownItem>
              <DropdownItem key="divider-1" className="h-px bg-gray-200 dark:bg-gray-600 my-2" isReadOnly>
                <div className="h-px bg-gray-200 dark:bg-gray-600"></div>
              </DropdownItem>
              <DropdownItem key="profile-action" startContent={<UserIcon className="w-4 h-4" />} onPress={handleProfileOpen} aria-label="Otevřít profil">
                <span>Profil</span>
              </DropdownItem>
              {hasBothAccess || hasAdminAccess || hasCoachAccess ? (
                <DropdownItem key="switch-to-coach" startContent={<AcademicCapIcon className="w-4 h-4" />} onPress={handleSwitchToCoachPortal} aria-label="Přepnout na trenérský portál">
                  <span>Přepnout na trenérský portál</span>
                </DropdownItem>
              ) : null}
              <DropdownItem key="settings" startContent={<Cog6ToothIcon className="w-4 h-4" />} aria-label="Nastavení">
                <span>Nastavení</span>
              </DropdownItem>
              <DropdownItem key="logout" color="danger" startContent={<ArrowRightEndOnRectangleIcon className="w-4 h-4" />} onPress={handleLogout} aria-label="Odhlásit se">
                <span>Odhlásit</span>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Profile Dialog */}
      <UserProfileModal 
        showProfileDialog={showProfileDialog}
        setShowProfileDialog={setShowProfileDialog}
        user={user}
      />

      {/* Release Notes Modal */}
      <ReleaseNotesModal showReleaseNotes={showReleaseNotes} setShowReleaseNotes={setShowReleaseNotes} />
    </div>
  );
};

'use client';

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePortalAccess } from "@/hooks/usePortalAccess";
import { 
  UserIcon,
  ArrowRightEndOnRectangleIcon,
  BellIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  Bars3Icon,
  AcademicCapIcon,
  ShieldCheckIcon
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
import { ReleaseNotesModal, UserProfileModal, ThemeSwitch, CoachPortalCategoryDialog } from "@/components";
import { logLogout } from "@/utils/loginLogger";
import { useAdminCategorySimulation } from "@/contexts/AdminCategorySimulationContext";

interface UnifiedTopBarProps {
  variant: 'admin' | 'coach';
  sidebarContext?: {
    isCollapsed?: boolean;
    isMobileOpen?: boolean;
    setIsMobileOpen?: (open: boolean) => void;
    isMobile?: boolean;
    toggleSidebar?: () => void;
  };
  pageTitle?: string;
  pageDescription?: string;
  userProfile?: {
    role?: string;
    clubs?: { name?: string };
  };
}

export const UnifiedTopBar = ({ 
  variant, 
  sidebarContext, 
  pageTitle, 
  pageDescription,
  userProfile 
}: UnifiedTopBarProps) => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { hasCoachAccess, hasBothAccess, hasAdminAccess, loading } = usePortalAccess();
  
  // Category selection for admin
  const adminCategorySimulation = variant === 'admin' ? useAdminCategorySimulation() : null;
  
  // State
  const [notifications, setNotifications] = useState(3);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showCoachPortalDialog, setShowCoachPortalDialog] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);

  // Load release notes
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

  // Handlers
  const handleLogout = async () => {
    try {
      if (user?.email) {
        try {
          await logLogout(user.email);
        } catch (logError) {
          console.error('Failed to log logout:', logError);
        }
      }
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleReleaseNotes = () => {
    setShowReleaseNotes(!showReleaseNotes);
  };

  const handleSwitchToCoachPortal = () => {
    if (variant === 'admin') {
      // Show category selection dialog first
      setShowCoachPortalDialog(true);
    } else {
      // Direct switch for coaches
      window.location.href = '/coaches/dashboard';
    }
  };

  const handleConfirmCoachPortalSwitch = () => {
    setShowCoachPortalDialog(false);
    window.location.href = '/coaches/dashboard';
  };

  const handleSwitchToAdminPortal = () => {
    window.location.href = '/admin';
  };

  const handleProfileOpen = () => {
    setShowProfileDialog(true);
  };

  // User display helpers
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    
    if (user.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    
    const emailParts = user.email.split('@')[0];
    if (emailParts.includes('.')) {
      const parts = emailParts.split('.');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
    }
    return emailParts[0].toUpperCase();
  };

  const getDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Uživatel';
  };

  const getRoleDisplay = () => {
    if (variant === 'coach') {
      return userProfile?.role === 'head_coach' ? 'Hlavní trenér' : 'Trenér';
    }
    return 'Administrátor';
  };

  const getClubDisplay = () => {
    if (variant === 'coach') {
      return userProfile?.clubs?.name || 'TJ Sokol Svinov';
    }
    return 'TJ Sokol Svinov';
  };

  // Determine if we should show portal switch
  const shouldShowPortalSwitch = () => {
    if (variant === 'admin') {
      // Admin users can switch to coach portal if they have coach access OR if they're admin (admin can access coach portal)
      return hasCoachAccess || hasAdminAccess;
    } else {
      // Coach users can switch to admin portal if they have admin access
      return hasAdminAccess;
    }
  };

  // Get the appropriate sidebar button
  const getSidebarButton = () => {
    if (!sidebarContext) return null;

    if (variant === 'admin' && sidebarContext.isMobile) {
      return (
        <Button
          isIconOnly
          variant="light"
          size="sm"
          className="lg:hidden"
          onPress={() => sidebarContext.setIsMobileOpen?.(true)}
          title="Otevřít menu"
        >
          <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Button>
      );
    }

    if (variant === 'coach') {
      return (
        <Button
          isIconOnly
          variant="light"
          className="lg:hidden"
          onPress={sidebarContext.toggleSidebar}
        >
          <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Button>
      );
    }

    return null;
  };

  // Get the appropriate header classes
  const getHeaderClasses = () => {
    if (variant === 'admin') {
      return `fixed top-0 right-0 bg-white h-20 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-40 transition-all duration-300 ease-in-out ${
        sidebarContext?.isMobile ? 'left-0' : 
        sidebarContext?.isCollapsed ? 'left-16' : 'left-64'
      }`;
    } else {
      return `fixed top-0 right-0 bg-white h-20 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-30 transition-all duration-300 ease-in-out ${
        sidebarContext?.isMobile ? 'left-0' : 
        sidebarContext?.isCollapsed ? 'left-16' : 'left-64'
      }`;
    }
  };

  // Get the appropriate content classes
  const getContentClasses = () => {
    if (variant === 'admin') {
      return "flex items-center justify-between h-full px-4 sm:px-6";
    } else {
      return "flex items-center justify-between px-4 py-3";
    }
  };

  return (
    <div className={getHeaderClasses()}>
      <div className={getContentClasses()}>
        {/* Left side - Mobile menu button and Section info */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {getSidebarButton()}
          
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
              {pageTitle || (variant === 'admin' ? 'Dashboard' : 'Trenérský Portal')}
            </h1>
            {pageDescription && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 hidden sm:block">
                {pageDescription}
              </p>
            )}
            {variant === 'coach' && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {getRoleDisplay()} • {getClubDisplay()}
              </p>
            )}
          </div>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Theme Switch */}
          <ThemeSwitch />

          {/* Release Notes Button */}
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
                className={variant === 'admin' ? '' : 'absolute -top-1 -right-1'}
              >
                {releaseNotes.length}
              </Badge>
            )}
          </Button>

          {/* Notifications - Admin only */}
          {variant === 'admin' && (
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
          )}

          {/* User Profile Dropdown */}
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                variant="light"
                className={`flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
                  variant === 'coach' ? 'p-2' : ''
                }`}
              >
                <Avatar
                  name={getUserInitials()}
                  className={`${
                    variant === 'coach' 
                      ? 'bg-green-100 text-green-700' 
                      : 'w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-medium'
                  }`}
                  size={variant === 'coach' ? 'sm' : undefined}
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {variant === 'coach' ? user?.email : getDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {variant === 'coach' 
                      ? getRoleDisplay()
                      : (user?.email || 'Načítání...')
                    }
                  </p>
                </div>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User actions">
              {variant === 'admin' ? (
                <>
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
                </>
              ) : null}
              <DropdownItem key="profile-action" startContent={<UserIcon className="w-4 h-4" />} onPress={handleProfileOpen} aria-label="Otevřít profil">
                <span>Profil</span>
              </DropdownItem>
              {shouldShowPortalSwitch() ? (
                <DropdownItem 
                  key="switch-portal" 
                  startContent={variant === 'admin' ? <AcademicCapIcon className="w-4 h-4" /> : <ShieldCheckIcon className="w-4 h-4" />} 
                  onPress={variant === 'admin' ? handleSwitchToCoachPortal : handleSwitchToAdminPortal}
                  aria-label={variant === 'admin' ? 'Přepnout na trenérský portál' : 'Přepnout na admin portál'}
                >
                  <span>{variant === 'admin' ? 'Přepnout na trenérský portál' : 'Přepnout na admin portál'}</span>
                </DropdownItem>
              ) : null}
              {variant === 'admin' ? (
                <DropdownItem key="settings" startContent={<Cog6ToothIcon className="w-4 h-4" />} aria-label="Nastavení">
                  <span>Nastavení</span>
                </DropdownItem>
              ) : null}
              <DropdownItem 
                key="logout" 
                color="danger" 
                startContent={<ArrowRightEndOnRectangleIcon className="w-4 h-4" />} 
                onPress={handleLogout} 
                aria-label="Odhlásit se"
                className={variant === 'coach' ? 'text-danger' : ''}
              >
                <span>{variant === 'admin' ? 'Odhlásit' : 'Odhlásit se'}</span>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Modals */}
      <UserProfileModal 
        showProfileDialog={showProfileDialog}
        setShowProfileDialog={setShowProfileDialog}
        user={user}
      />
      <ReleaseNotesModal showReleaseNotes={showReleaseNotes} setShowReleaseNotes={setShowReleaseNotes} />
      {variant === 'admin' && (
        <CoachPortalCategoryDialog
          isOpen={showCoachPortalDialog}
          onClose={() => setShowCoachPortalDialog(false)}
          onConfirm={handleConfirmCoachPortalSwitch}
        />
      )}
    </div>
  );
};

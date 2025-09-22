'use client';

import React, {useState, useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {createPortal} from 'react-dom';
import {useAuth} from '@/hooks/useAuthNew';
import {usePortalAccess} from '@/hooks/usePortalAccess';
import {
  UserIcon,
  ArrowRightEndOnRectangleIcon,
  BellIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  Bars3Icon,
  AcademicCapIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Badge,
  Avatar,
} from '@heroui/react';
import {ReleaseNote, getReleaseNotes} from '@/utils/releaseNotes';
import {
  ReleaseNotesModal,
  UserProfileModal,
  ThemeSwitch,
  CoachPortalCategoryDialog,
  showToast,
} from '@/components';
import {logLogout} from '@/utils/loginLogger';

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
    clubs?: {name?: string};
  };
}

export const UnifiedTopBar = ({
  variant,
  sidebarContext,
  pageTitle,
  pageDescription,
  userProfile,
}: UnifiedTopBarProps) => {
  const pathname = usePathname();
  const {user, signOut} = useAuth();
  const {hasCoachAccess, hasBothAccess, hasAdminAccess, loading} = usePortalAccess();

  // State
  const [notifications, setNotifications] = useState(3);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showCoachPortalDialog, setShowCoachPortalDialog] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutProgress, setLogoutProgress] = useState(0);
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

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
    if (isLoggingOut) return; // Prevent multiple clicks

    setIsLoggingOut(true);
    setLogoutProgress(0);

    try {
      // Step 1: Logging logout
      setLogoutProgress(25);
      if (user?.email) {
        try {
          await logLogout(user.email);
        } catch (logError) {
          console.error('Failed to log logout:', logError);
          // Don't show error toast for logging failure, just continue with logout
        }
      }

      // Small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Step 2: Sign out
      setLogoutProgress(50);
      await signOut();

      // Small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Step 3: Show success message
      setLogoutProgress(75);
      showToast.success('Úspěšně odhlášen. Přesměrovávám...');

      // Small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 4: Complete and redirect
      setLogoutProgress(100);
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000); // Increased from 1000ms to 3000ms for better visibility
    } catch (error) {
      console.error('Logout error:', error);
      showToast.danger('Chyba při odhlašování. Zkuste to znovu.');
      setIsLoggingOut(false); // Reset state on error
      setLogoutProgress(0);
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
          onPress={() => sidebarContext.setIsMobileOpen?.(true)}
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
        sidebarContext?.isMobile ? 'left-0' : sidebarContext?.isCollapsed ? 'left-16' : 'left-56'
      }`;
    } else {
      return `fixed top-0 right-0 bg-white h-20 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-30 transition-all duration-300 ease-in-out ${
        sidebarContext?.isMobile ? 'left-0' : sidebarContext?.isCollapsed ? 'left-16' : 'left-56'
      }`;
    }
  };

  // Get the appropriate content classes
  const getContentClasses = () => {
    if (variant === 'admin') {
      return 'flex items-center justify-between h-full px-4 sm:px-6';
    } else {
      return 'flex items-center justify-between px-4 py-3';
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
                <Badge color="danger" size="sm" className="absolute -top-1 -right-1">
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
                } ${isLoggingOut ? 'opacity-70' : ''}`}
                isDisabled={isLoggingOut}
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
                    {variant === 'coach' ? getRoleDisplay() : user?.email || 'Načítání...'}
                  </p>
                </div>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User actions">
              {variant === 'admin' ? (
                <>
                  <DropdownItem
                    key="profile-header"
                    className="py-3"
                    onPress={handleProfileOpen}
                    aria-label="Otevřít profil"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar
                        name={getUserInitials()}
                        className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-base font-medium"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getDisplayName()}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                      </div>
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    key="divider-1"
                    className="h-px bg-gray-200 dark:bg-gray-600 my-2"
                    isReadOnly
                    aria-label="Oddělovač"
                  >
                    <div className="h-px bg-gray-200 dark:bg-gray-600"></div>
                  </DropdownItem>
                </>
              ) : null}
              <DropdownItem
                key="profile-action"
                startContent={<UserIcon className="w-4 h-4" />}
                onPress={handleProfileOpen}
                aria-label="Otevřít profil"
              >
                <span>Profil</span>
              </DropdownItem>
              {shouldShowPortalSwitch() ? (
                <DropdownItem
                  key="switch-portal"
                  startContent={
                    variant === 'admin' ? (
                      <AcademicCapIcon className="w-4 h-4" />
                    ) : (
                      <ShieldCheckIcon className="w-4 h-4" />
                    )
                  }
                  onPress={
                    variant === 'admin' ? handleSwitchToCoachPortal : handleSwitchToAdminPortal
                  }
                  aria-label={
                    variant === 'admin'
                      ? 'Přepnout na trenérský portál'
                      : 'Přepnout na admin portál'
                  }
                >
                  <span>
                    {variant === 'admin'
                      ? 'Přepnout na trenérský portál'
                      : 'Přepnout na admin portál'}
                  </span>
                </DropdownItem>
              ) : null}
              {variant === 'admin' ? (
                <DropdownItem
                  key="settings"
                  startContent={<Cog6ToothIcon className="w-4 h-4" />}
                  aria-label="Nastavení"
                >
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
                isDisabled={isLoggingOut}
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
      <ReleaseNotesModal
        showReleaseNotes={showReleaseNotes}
        setShowReleaseNotes={setShowReleaseNotes}
      />
      {variant === 'admin' && (
        <CoachPortalCategoryDialog
          isOpen={showCoachPortalDialog}
          onClose={() => setShowCoachPortalDialog(false)}
          onConfirm={handleConfirmCoachPortalSwitch}
        />
      )}

      {/* Logout Progress Overlay - Rendered via Portal */}
      {isLoggingOut &&
        isClient &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            style={{zIndex: 999999}}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
              <div className="text-center">
                {/* Spinner */}
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{width: `${logoutProgress}%`}}
                  ></div>
                </div>

                {/* Progress Text */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Odhlašování...
                </h3>

                {/* Progress Steps */}
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {logoutProgress >= 25 && (
                    <div className="flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Zaznamenávání odhlášení...
                    </div>
                  )}
                  {logoutProgress >= 50 && (
                    <div className="flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Ukončování relace...
                    </div>
                  )}
                  {logoutProgress >= 75 && (
                    <div className="flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Připravování přesměrování...
                    </div>
                  )}
                  {logoutProgress >= 100 && (
                    <div className="flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Dokončování...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

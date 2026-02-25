'use client';

import React, {useMemo, useState} from 'react';

import {CoachPortalCategoryDialog, ReleaseNotesModal} from '@/components/features';
import {UserProfileModal} from '@/components/ui/modals';

import {UserRoles} from '@/enums';
import {useAuth, usePortalAccess} from '@/hooks';
import {getReleaseNotes} from '@/utils';

import {LogoutOverlay, TopBarActions, TopBarPageInfo, TopBarUserDropdown} from './components';
import {useLogout} from './hooks/useLogout';
import {getContentClasses, getHeaderClasses} from './utils';

export type variantType = UserRoles.ADMIN | UserRoles.COACH;

export type userProfileType = {
  role?: string;
  clubs?: {name?: string}[];
};

export type sidebarContextType = {
  isCollapsed?: boolean;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  isMobile?: boolean;
  toggleSidebar?: () => void;
};

interface UnifiedTopBarProps {
  variant: variantType;
  sidebarContext?: sidebarContextType;
  pageTitle?: string;
  pageDescription?: string;
  userProfile?: userProfileType;
}

export const UnifiedTopBar = ({
  variant,
  sidebarContext,
  pageTitle,
  pageDescription,
  userProfile,
}: UnifiedTopBarProps) => {
  const {user} = useAuth();
  const {hasCoachAccess, hasAdminAccess} = usePortalAccess();

  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showCoachPortalDialog, setShowCoachPortalDialog] = useState(false);

  const {isLoggingOut, logoutProgress, logoutError, handleLogout, cancelLogout} = useLogout();

  const releaseNotes = useMemo(() => {
    try {
      return getReleaseNotes();
    } catch {
      return [];
    }
  }, []);

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

  // Determine if we should show portal switch
  const shouldShowPortalSwitch = (): boolean => {
    if (variant === UserRoles.ADMIN) {
      // Admin users can switch to coach portal if they have coach access OR if they're admin (admin can access coach portal)
      return hasCoachAccess || hasAdminAccess;
    } else {
      // Coach users can switch to admin portal if they have admin access
      return hasAdminAccess;
    }
  };

  return (
    <div className={getHeaderClasses(variant, sidebarContext)}>
      <div className={getContentClasses(variant)}>
        <TopBarPageInfo
          variant={variant}
          sidebarContext={sidebarContext}
          pageTitle={pageTitle}
          pageDescription={pageDescription}
        />

        <div className="flex items-center space-x-1 sm:space-x-2 xl:space-x-4 shrink-0">
          <TopBarActions
            releaseNotes={releaseNotes}
            variant={variant}
            handleReleaseNotes={handleReleaseNotes}
          />

          <TopBarUserDropdown
            variant={variant}
            user={user}
            shouldShowPortalSwitch={shouldShowPortalSwitch()}
            handleProfileOpen={handleProfileOpen}
            handleSwitchToCoachPortal={handleSwitchToCoachPortal}
            handleSwitchToAdminPortal={handleSwitchToAdminPortal}
            isLoggingOut={isLoggingOut}
            handleLogout={handleLogout}
            userProfile={userProfile}
          />
        </div>
      </div>

      <UserProfileModal
        showProfileDialog={showProfileDialog}
        setShowProfileDialog={setShowProfileDialog}
        user={user}
      />
      <ReleaseNotesModal
        showReleaseNotes={showReleaseNotes}
        setShowReleaseNotes={setShowReleaseNotes}
      />
      {variant === UserRoles.ADMIN && (
        <CoachPortalCategoryDialog
          isOpen={showCoachPortalDialog}
          onClose={() => setShowCoachPortalDialog(false)}
          onConfirm={handleConfirmCoachPortalSwitch}
        />
      )}

      <LogoutOverlay
        isLoggingOut={isLoggingOut}
        logoutProgress={logoutProgress}
        logoutError={logoutError}
        onRetry={handleLogout}
        onCancel={cancelLogout}
      />
    </div>
  );
};

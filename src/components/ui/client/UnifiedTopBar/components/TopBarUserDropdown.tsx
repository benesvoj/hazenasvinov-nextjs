'use client';

import React from 'react';

import {Avatar, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger} from '@heroui/react';

import {
  AcademicCapIcon,
  ArrowRightEndOnRectangleIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

import {User} from '@supabase/supabase-js';

import {isAdminPortal, isCoachPortal, PortalVariant} from '@/lib/portal';
import {translations} from '@/lib/translations/index';

import {userProfileType} from '../UnifiedTopBar';
import {getDisplayName, getRoleDisplay, getUserInitials} from '../utils';

interface TopBarUserDropdownProps {
  variant: PortalVariant;
  userProfile: userProfileType | undefined;
  isLoggingOut?: boolean;
  user: User | null;
  handleProfileOpen?: () => void;
  shouldShowPortalSwitch: boolean;
  handleSwitchToCoachPortal?: () => void;
  handleSwitchToAdminPortal?: () => void;
  handleLogout?: () => void;
}

const USER_INFO_MAX_WIDTH = 'max-w-32'; // 128px - max width for user info text on smaller screens
const USER_INFO_MAX_WIDTH_XL = 'xl:max-w-none'; // No max width on extra large screens

export const TopBarUserDropdown = ({
  variant,
  userProfile,
  isLoggingOut,
  user,
  handleProfileOpen,
  shouldShowPortalSwitch,
  handleSwitchToCoachPortal,
  handleSwitchToAdminPortal,
  handleLogout,
}: TopBarUserDropdownProps) => {
  const isAdmin = isAdminPortal(variant);
  const isCoach = isCoachPortal(variant);

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          variant="light"
          className={`flex items-center space-x-1 sm:space-x-2 md:space-x-3 px-1 sm:px-2 md:px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
            isCoach ? 'p-1 sm:p-2' : ''
          } ${isLoggingOut ? 'opacity-70' : ''}`}
          isDisabled={isLoggingOut}
        >
          <Avatar
            name={getUserInitials(user)}
            className={`${
              isCoach
                ? 'bg-green-100 text-green-700'
                : 'w-8 h-8 bg-linear-to-br from-blue-500 to-blue-600 text-white text-sm font-medium'
            }`}
            size={isCoach ? 'sm' : undefined}
          />
          {/* User info - visible from sm breakpoint, merged small/medium behavior */}
          <div className="hidden sm:block text-left min-w-0">
            <p
              className={`text-sm font-medium text-gray-900 dark:text-white truncate ${USER_INFO_MAX_WIDTH} ${USER_INFO_MAX_WIDTH_XL}`}
            >
              {isCoach ? user?.email : getDisplayName(user)}
            </p>
            <p
              className={`text-xs text-gray-500 dark:text-gray-400 truncate ${USER_INFO_MAX_WIDTH} ${USER_INFO_MAX_WIDTH_XL}`}
            >
              {isCoach
                ? getRoleDisplay(variant, userProfile)
                : user?.email || translations.common.loading}
            </p>
          </div>
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="User actions">
        {isAdmin ? (
          <>
            <DropdownItem
              key="profile-header"
              className="py-3"
              onPress={handleProfileOpen}
              aria-label={translations.common.actions.openProfile}
            >
              <div className="flex items-center space-x-3">
                <Avatar
                  name={getUserInitials(user)}
                  className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 text-white text-base font-medium"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getDisplayName(user)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
              </div>
            </DropdownItem>
            <DropdownItem
              key="divider-1"
              className="h-px bg-gray-200 dark:bg-gray-600 my-2"
              isReadOnly
              aria-label={translations.common.labels.divider}
            >
              <div className="h-px bg-gray-200 dark:bg-gray-600"></div>
            </DropdownItem>
          </>
        ) : null}
        <DropdownItem
          key="profile-action"
          startContent={<UserIcon className="w-4 h-4" />}
          onPress={handleProfileOpen}
          aria-label={translations.common.actions.openProfile}
        >
          <span>{translations.common.labels.profile}</span>
        </DropdownItem>
        {shouldShowPortalSwitch ? (
          <DropdownItem
            key="switch-portal"
            startContent={
              isAdmin ? (
                <AcademicCapIcon className="w-4 h-4" />
              ) : (
                <ShieldCheckIcon className="w-4 h-4" />
              )
            }
            onPress={isAdmin ? handleSwitchToCoachPortal : handleSwitchToAdminPortal}
            aria-label={
              isAdmin
                ? translations.topBar.labels.switchToCoachPortal
                : translations.topBar.labels.switchToAdminPortal
            }
          >
            <span>
              {isAdmin
                ? translations.topBar.labels.switchToCoachPortal
                : translations.topBar.labels.switchToAdminPortal}
            </span>
          </DropdownItem>
        ) : null}
        {isAdmin ? (
          <DropdownItem
            key="settings"
            startContent={<Cog6ToothIcon className="w-4 h-4" />}
            aria-label={translations.common.labels.settings}
          >
            <span>{translations.common.labels.settings}</span>
          </DropdownItem>
        ) : null}
        <DropdownItem
          key="logout"
          color="danger"
          startContent={<ArrowRightEndOnRectangleIcon className="w-4 h-4" />}
          onPress={handleLogout}
          aria-label={translations.common.actions.logout}
          className={isCoach ? 'text-danger' : ''}
        >
          <span>{translations.common.actions.logout}</span>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

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

import {UserRoles} from '@/enums';

import {userProfileType} from '../UnifiedTopBar';
import {getDisplayName, getRoleDisplay, getUserInitials} from '../utils';

interface TopBarUserDropdownProps {
  variant: UserRoles;
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
  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          variant="light"
          className={`flex items-center space-x-1 sm:space-x-2 md:space-x-3 px-1 sm:px-2 md:px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
            variant === UserRoles.COACH ? 'p-1 sm:p-2' : ''
          } ${isLoggingOut ? 'opacity-70' : ''}`}
          isDisabled={isLoggingOut}
        >
          <Avatar
            name={getUserInitials(user)}
            className={`${
              variant === UserRoles.COACH
                ? 'bg-green-100 text-green-700'
                : 'w-8 h-8 bg-linear-to-br from-blue-500 to-blue-600 text-white text-sm font-medium'
            }`}
            size={variant === UserRoles.COACH ? 'sm' : undefined}
          />
          {/* User info - visible from sm breakpoint, merged small/medium behavior */}
          <div className="hidden sm:block text-left min-w-0">
            <p
              className={`text-sm font-medium text-gray-900 dark:text-white truncate ${USER_INFO_MAX_WIDTH} ${USER_INFO_MAX_WIDTH_XL}`}
            >
              {variant === 'coach' ? user?.email : getDisplayName(user)}
            </p>
            <p
              className={`text-xs text-gray-500 dark:text-gray-400 truncate ${USER_INFO_MAX_WIDTH} ${USER_INFO_MAX_WIDTH_XL}`}
            >
              {variant === 'coach'
                ? getRoleDisplay(variant, userProfile)
                : user?.email || 'Načítání...'}
            </p>
          </div>
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="User actions">
        {variant === UserRoles.ADMIN ? (
          <>
            <DropdownItem
              key="profile-header"
              className="py-3"
              onPress={handleProfileOpen}
              aria-label="Otevřít profil"
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
        {shouldShowPortalSwitch ? (
          <DropdownItem
            key="switch-portal"
            startContent={
              variant === UserRoles.ADMIN ? (
                <AcademicCapIcon className="w-4 h-4" />
              ) : (
                <ShieldCheckIcon className="w-4 h-4" />
              )
            }
            onPress={
              variant === UserRoles.ADMIN ? handleSwitchToCoachPortal : handleSwitchToAdminPortal
            }
            aria-label={
              variant === UserRoles.ADMIN
                ? 'Přepnout na trenérský portál'
                : 'Přepnout na admin portál'
            }
          >
            <span>
              {variant === UserRoles.ADMIN
                ? 'Přepnout na trenérský portál'
                : 'Přepnout na admin portál'}
            </span>
          </DropdownItem>
        ) : null}
        {variant === UserRoles.ADMIN ? (
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
          className={variant === UserRoles.COACH ? 'text-danger' : ''}
        >
          <span>{variant === UserRoles.ADMIN ? 'Odhlásit' : 'Odhlásit se'}</span>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

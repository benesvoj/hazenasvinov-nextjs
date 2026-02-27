'use client';

import React from 'react';

import {Button} from '@heroui/react';

import {Bars3Icon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations/index';

import {UserRoles} from '@/enums';

import {sidebarContextType} from '../UnifiedTopBar';

interface TopBarPageInfoProps {
  variant: UserRoles;
  pageTitle?: string;
  pageDescription?: string;
  sidebarContext?: sidebarContextType;
}

export const TopBarPageInfo = ({
  variant,
  pageTitle,
  pageDescription,
  sidebarContext,
}: TopBarPageInfoProps) => {
  const getSidebarButton = () => {
    if (!sidebarContext) return null;

    // Show sidebar button only when sidebar is hidden (mobile screens)
    // Both admin and coach sidebars are visible on lg+ (1024px+)
    if (sidebarContext.isMobile) {
      return (
        <Button
          isIconOnly
          variant="light"
          size="sm"
          className="lg:hidden"
          onPress={() => sidebarContext.setIsMobileOpen?.(true)}
          title={translations.common.actions.openMenu}
        >
          <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
      {getSidebarButton()}

      <div className="min-w-0 flex-1">
        <h1 className="text-base sm:text-lg xl:text-xl font-semibold text-gray-900 dark:text-white truncate">
          {pageTitle ||
            (variant === UserRoles.ADMIN
              ? translations.topBar.labels.dashboard
              : translations.topBar.labels.coachPortal)}
        </h1>
        {pageDescription && (
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 hidden sm:block">
            {pageDescription}
          </p>
        )}
      </div>
    </div>
  );
};

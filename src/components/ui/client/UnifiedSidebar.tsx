'use client';

import React, {useState} from 'react';

import Link from 'next/link';
import {usePathname} from 'next/navigation';

import {Button} from '@heroui/button';

import {
  AcademicCapIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  TrophyIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import {APP_ROUTES} from '@/lib/app-routes';
import {allRoutes, coachesNavRoutes, NavMenuItem, RouteGroups} from '@/lib/navigation';
import {translations} from '@/lib/translations';

import {PortalVariants} from '@/enums';

interface UnifiedSidebarProps {
  variant: PortalVariants;
  sidebarContext?: {
    isCollapsed?: boolean;
    setIsCollapsed?: (collapsed: boolean) => void;
    isMobileOpen?: boolean;
    setIsMobileOpen?: (open: boolean) => void;
    isMobile?: boolean;
    toggleSidebar?: () => void;
  };
}

export const UnifiedSidebar = ({variant, sidebarContext}: UnifiedSidebarProps) => {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Toggle group collapse/expand (admin only)
  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const handleNavClick = () => {
    if (sidebarContext?.isMobile) {
      sidebarContext.setIsMobileOpen?.(false);
    }
  };

  // Get sidebar configuration based on variant
  const getSidebarConfig = () => {
    if (variant === PortalVariants.ADMIN) {
      const items = allRoutes.filter((item) => item.isPrivate === true && !item.hidden);

      // Group items by group property
      const groupedItems = items.reduce(
        (acc, item) => {
          const group = item.group || RouteGroups.OTHER;
          if (!acc[group]) {
            acc[group] = [];
          }
          acc[group].push(item);
          return acc;
        },
        {} as Record<string, typeof items>
      );

      return {
        title: translations.common.admin.title,
        subtitle: translations.common.admin.subtitle,
        icon: <TrophyIcon className="w-6 h-6 text-white" />,
        iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
        groupedItems,
        groupLabels: {
          [RouteGroups.TEAM]: translations.common.admin.groups.teamManagement,
          [RouteGroups.USER]: translations.common.admin.groups.userManagement,
          [RouteGroups.MEMBER]: translations.common.admin.groups.membersManagement,
          [RouteGroups.CLUB]: translations.common.admin.groups.clubManagement,
          [RouteGroups.OTHER]: translations.common.admin.groups.other,
        },
        footer: {
          title: translations.common.clubTitle,
          subtitle: translations.common.admin.title,
        },
      };
    } else {
      return {
        title: translations.coachPortal.title,
        subtitle: '',
        icon: <AcademicCapIcon className="w-8 h-8 text-green-600 dark:text-green-400" />,
        iconBg: '',
        groupedItems: {main: coachesNavRoutes},
        groupLabels: {},
        footer: {
          title: translations.common.clubTitle,
          subtitle: translations.common.coachPortal.title,
        },
      };
    }
  };

  const config = getSidebarConfig();
  const isCollapsed = sidebarContext?.isCollapsed || false;
  const isMobileOpen = sidebarContext?.isMobileOpen || false;
  const isMobile = sidebarContext?.isMobile || false;

  // Get styling classes based on variant
  const getSidebarClasses = () => {
    if (variant === PortalVariants.ADMIN) {
      return {
        container: `fixed left-0 top-0 h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white transition-all duration-300 ease-in-out z-50 shadow-xl flex flex-col ${
          isCollapsed ? 'w-16' : 'w-56'
        }`,
        mobileContainer: `fixed left-0 top-0 h-full w-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col -translate-x-full`,
        header:
          'flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm h-20',
        navItem: (isActive: boolean) =>
          `group flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px] ${
            isActive
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-r-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
          }`,
        navItemIcon: (isActive: boolean) => `w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'}`,
        footer: 'p-4 border-t border-gray-700 bg-gray-800/30',
        groupHeader:
          'w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/30 rounded-lg transition-colors duration-200 min-h-[48px]',
        groupLabel: 'text-xs font-semibold text-gray-400 uppercase tracking-wider',
        divider: 'mx-3 border-t border-gray-700/50',
      };
    } else {
      return {
        container: `fixed top-0 left-0 z-50 h-screen bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out flex flex-col ${
          isCollapsed ? 'w-16' : 'w-56'
        }`,
        mobileContainer: `fixed top-0 left-0 z-50 h-full w-full bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out flex flex-col -translate-x-full`,
        header:
          'flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 h-20',
        navItem: (isActive: boolean) =>
          `flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px] ${
            isActive
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-r-2 border-green-600 dark:border-green-400'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
          }`,
        navItemIcon: (isActive: boolean) => `w-5 h-5 mr-3`,
        footer: 'p-4 border-t border-gray-200 dark:border-gray-700 mt-auto',
        groupHeader: '',
        groupLabel: '',
        divider: '',
      };
    }
  };

  const classes = getSidebarClasses();

  // Mobile overlay
  if (isMobile && isMobileOpen) {
    return (
      <>
        {/* Mobile overlay */}
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => sidebarContext?.setIsMobileOpen?.(false)}
        />

        {/* Mobile sidebar */}
        <aside className={`${classes.mobileContainer} translate-x-0`}>
          {/* Mobile Header */}
          <div className={classes.header}>
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 ${config.iconBg} rounded-xl flex items-center justify-center shadow-lg`}
              >
                {config.icon}
              </div>
              <div>
                <h1
                  className={`text-lg font-bold ${
                    variant === PortalVariants.ADMIN
                      ? 'text-white'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {config.title}
                </h1>
                {config.subtitle && (
                  <p
                    className={`text-xs ${
                      variant === PortalVariants.ADMIN
                        ? 'text-gray-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {config.subtitle}
                  </p>
                )}
              </div>
            </div>
            <Button
              isIconOnly
              variant="light"
              onPress={() => sidebarContext?.setIsMobileOpen?.(false)}
              title="Zavřít menu"
              startContent={
                <XMarkIcon
                  className={`w-6 h-6 ${
                    variant === PortalVariants.ADMIN
                      ? 'text-white'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                />
              }
            />
          </div>

          {/* Mobile Navigation */}
          <nav
            className="flex-1 py-6 overflow-y-auto scrollbar-hide relative"
            style={{
              minHeight: 0,
              height: 'calc(100vh - 120px)', // Fixed height for proper scrolling (80px header + 40px footer)
            }}
          >
            {/* Scroll gradient indicators */}
            <div
              className={`absolute top-0 left-0 right-0 h-4 pointer-events-none z-10 ${
                variant === PortalVariants.ADMIN
                  ? 'bg-linear-to-b from-gray-900 via-gray-900/50 to-transparent'
                  : 'bg-gradient-to-b from-white dark:from-gray-800 via-white/50 dark:via-gray-800/50 to-transparent'
              }`}
            />
            <div
              className={`absolute bottom-0 left-0 right-0 h-4 pointer-events-none z-10 ${
                variant === PortalVariants.ADMIN
                  ? 'bg-linear-to-t from-gray-900 via-gray-900/50 to-transparent'
                  : 'bg-linear-to-t from-white dark:from-gray-800 via-white/50 dark:via-gray-800/50 to-transparent'
              }`}
            />

            <div className="space-y-6 px-4">
              {Object.entries(config.groupedItems).map(([groupKey, groupItems], groupIndex) => (
                <div key={groupKey} className="space-y-2">
                  {/* Group Header - Admin only */}
                  {variant === PortalVariants.ADMIN && groupKey !== RouteGroups.OTHER && (
                    <button onClick={() => toggleGroup(groupKey)} className={classes.groupHeader}>
                      <h3 className={classes.groupLabel}>
                        {config.groupLabels[groupKey as keyof typeof config.groupLabels]}
                      </h3>
                      {collapsedGroups.has(groupKey) ? (
                        <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  )}

                  {/* Group Divider - Admin only */}
                  {variant === PortalVariants.ADMIN &&
                    groupIndex > 0 &&
                    groupKey !== RouteGroups.OTHER && <div className={classes.divider}></div>}

                  {/* Group Items */}
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      variant === 'admin' && collapsedGroups.has(groupKey)
                        ? 'max-h-0 opacity-0'
                        : 'max-h-96 opacity-100'
                    }`}
                  >
                    {groupItems.map((item: NavMenuItem) => {
                      const isActive =
                        variant === PortalVariants.ADMIN
                          ? pathname === (item as NavMenuItem).href
                          : pathname === (item as NavMenuItem).href;
                      const icon =
                        variant === PortalVariants.ADMIN
                          ? React.createElement((item as NavMenuItem).icon || Cog6ToothIcon, {
                              className: 'w-5 h-5',
                            })
                          : React.createElement((item as NavMenuItem).icon || Cog6ToothIcon, {
                              className: 'w-5 h-5',
                            });

                      return (
                        <Link
                          key={
                            variant === PortalVariants.ADMIN
                              ? (item as NavMenuItem).href
                              : (item as NavMenuItem).href
                          }
                          href={
                            variant === PortalVariants.ADMIN
                              ? (item as NavMenuItem).href || APP_ROUTES.admin.root
                              : (item as NavMenuItem).href || APP_ROUTES.coaches.dashboard
                          }
                          onClick={handleNavClick}
                          className={classes.navItem(isActive)}
                          title={
                            isCollapsed
                              ? variant === PortalVariants.ADMIN
                                ? (item as NavMenuItem).title
                                : (item as NavMenuItem).title
                              : undefined
                          }
                        >
                          <div className={`flex items-center relative z-10 space-x-3`}>
                            <div className={classes.navItemIcon(isActive)}>{icon}</div>
                            <span className="text-sm font-medium">
                              {variant === PortalVariants.ADMIN
                                ? (item as NavMenuItem).title
                                : (item as NavMenuItem).title}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* Mobile Footer */}
          <div className={`${classes.footer} flex flex-col items-center space-y-3`}>
            <div className="text-center">
              <div
                className={`text-xs mb-1 ${
                  variant === PortalVariants.ADMIN
                    ? 'text-gray-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {config.footer.title}
              </div>
              {config.footer.subtitle && (
                <div
                  className={`text-xs ${
                    variant === PortalVariants.ADMIN
                      ? 'text-gray-500'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {config.footer.subtitle}
                </div>
              )}
            </div>
          </div>
        </aside>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={`${classes.container} ${
        variant === PortalVariants.COACH ? 'hidden lg:block lg:translate-x-0' : 'hidden lg:block'
      }`}
    >
      {/* Header */}
      <div className={classes.header}>
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 ${config.iconBg} rounded-xl flex items-center justify-center shadow-lg`}
            >
              {config.icon}
            </div>
            <div>
              <h1
                className={`text-lg font-bold ${
                  variant === PortalVariants.ADMIN ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}
              >
                {config.title}
              </h1>
              {config.subtitle && (
                <p
                  className={`text-xs ${
                    variant === PortalVariants.ADMIN
                      ? 'text-gray-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {config.subtitle}
                </p>
              )}
            </div>
          </div>
        )}
        <button
          onClick={() =>
            sidebarContext?.toggleSidebar?.() || sidebarContext?.setIsCollapsed?.(!isCollapsed)
          }
          className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
            variant === PortalVariants.ADMIN
              ? 'hover:bg-gray-700/50'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title={isCollapsed ? 'Rozbalit menu' : 'Sbalit menu'}
        >
          {isCollapsed ? (
            <ChevronDoubleRightIcon
              className={`w-5 h-5 ${
                variant === PortalVariants.ADMIN ? 'text-white' : 'text-gray-600 dark:text-gray-300'
              }`}
            />
          ) : (
            <ChevronDoubleLeftIcon
              className={`w-5 h-5 ${
                variant === PortalVariants.ADMIN ? 'text-white' : 'text-gray-600 dark:text-gray-300'
              }`}
            />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 py-4 overflow-y-auto scrollbar-hide"
        style={{
          minHeight: 0,
          height: 'calc(100vh - 140px)', // Fixed height for proper scrolling (80px header + 60px footer)
        }}
      >
        <div className="space-y-4 px-3">
          {Object.entries(config.groupedItems).map(([groupKey, groupItems], groupIndex) => (
            <div key={groupKey} className="space-y-2">
              {/* Group Header - Admin only */}
              {variant === PortalVariants.ADMIN &&
                groupKey !== RouteGroups.OTHER &&
                !isCollapsed && (
                  <button onClick={() => toggleGroup(groupKey)} className={classes.groupHeader}>
                    <h3 className={classes.groupLabel}>
                      {config.groupLabels[groupKey as keyof typeof config.groupLabels]}
                    </h3>
                    {collapsedGroups.has(groupKey) ? (
                      <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                )}

              {/* Group Divider - Admin only */}
              {variant === PortalVariants.ADMIN &&
                groupIndex > 0 &&
                groupKey !== RouteGroups.OTHER &&
                !isCollapsed && <div className={classes.divider}></div>}

              {/* Group Items */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  variant === PortalVariants.ADMIN && collapsedGroups.has(groupKey)
                    ? 'max-h-0 opacity-0'
                    : variant === PortalVariants.COACH
                      ? 'max-h-150 opacity-100'
                      : 'max-h-96 opacity-100'
                }`}
              >
                {groupItems.map((item: NavMenuItem) => {
                  const isActive =
                    variant === PortalVariants.ADMIN
                      ? pathname === (item as NavMenuItem).href
                      : pathname === (item as NavMenuItem).href;
                  const icon =
                    variant === PortalVariants.ADMIN
                      ? React.createElement((item as NavMenuItem).icon || Cog6ToothIcon, {
                          className: 'w-5 h-5',
                        })
                      : React.createElement((item as NavMenuItem).icon || Cog6ToothIcon, {
                          className: 'w-5 h-5',
                        });

                  return (
                    <Link
                      key={
                        variant === PortalVariants.ADMIN
                          ? (item as NavMenuItem).href
                          : (item as NavMenuItem).href
                      }
                      href={
                        variant === PortalVariants.ADMIN
                          ? (item as NavMenuItem).href || APP_ROUTES.admin.root
                          : (item as NavMenuItem).href || APP_ROUTES.coaches.dashboard
                      }
                      className={classes.navItem(isActive)}
                      title={
                        isCollapsed
                          ? variant === PortalVariants.ADMIN
                            ? (item as NavMenuItem).title
                            : (item as NavMenuItem).title
                          : undefined
                      }
                    >
                      <div
                        className={`flex items-center relative z-10 ${
                          isCollapsed ? 'justify-center w-full' : 'space-x-3'
                        }`}
                      >
                        <div className={classes.navItemIcon(isActive)}>{icon}</div>
                        {!isCollapsed && (
                          <span className="text-sm font-medium">
                            {variant === PortalVariants.ADMIN
                              ? (item as NavMenuItem).title
                              : (item as NavMenuItem).title}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className={classes.footer}>
        <div className="text-center">
          <div
            className={`text-xs mb-1 ${
              variant === PortalVariants.ADMIN
                ? 'text-gray-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {config.footer.title}
          </div>
          {config.footer.subtitle && (
            <div
              className={`text-xs ${
                variant === PortalVariants.ADMIN
                  ? 'text-gray-500'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {config.footer.subtitle}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

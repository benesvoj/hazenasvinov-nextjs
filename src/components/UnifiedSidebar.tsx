"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { translations } from "@/lib/translations";
import { coachesRoutes } from "@/app/coaches/routes/routes";
import routes, { privateRoutes } from "@/routes/routes";
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  TrophyIcon,
  UsersIcon,
  Cog6ToothIcon,
  CogIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  HeartIcon,
  TagIcon,
  PhotoIcon,
  VideoCameraIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";

interface UnifiedSidebarProps {
  variant: "admin" | "coach";
  sidebarContext?: {
    isCollapsed?: boolean;
    setIsCollapsed?: (collapsed: boolean) => void;
    isMobileOpen?: boolean;
    setIsMobileOpen?: (open: boolean) => void;
    isMobile?: boolean;
    toggleSidebar?: () => void;
  };
}

interface AdminRouteItem {
  title: string;
  route?: string;
  description?: string;
  isPrivate?: boolean;
  hidden?: boolean;
  group?: string;
}

interface CoachRouteItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Icon mapping for admin routes
const getAdminRouteIcon = (route: string) => {
  switch (route) {
    case privateRoutes.admin:
      return <HomeIcon className="w-5 h-5" />;
    case privateRoutes.users:
      return <UsersIcon className="w-5 h-5" />;
    case privateRoutes.posts:
      return <DocumentTextIcon className="w-5 h-5" />;
    case privateRoutes.categories:
      return <TagIcon className="w-5 h-5" />;
    case privateRoutes.seasons:
      return <CalendarIcon className="w-5 h-5" />;
    case privateRoutes.teams:
      return <UserGroupIcon className="w-5 h-5" />;
    case privateRoutes.teamCategories:
      return <BuildingOfficeIcon className="w-5 h-5" />;
    case privateRoutes.matches:
      return <TrophyIcon className="w-5 h-5" />;
    case privateRoutes.members:
      return <UsersIcon className="w-5 h-5" />;
    case privateRoutes.memberFunctions:
      return <CogIcon className="w-5 h-5" />;
    case privateRoutes.committees:
      return <BuildingOfficeIcon className="w-5 h-5" />;
    case privateRoutes.competitions:
      return <TrophyIcon className="w-5 h-5" />;
    case privateRoutes.sponsorship:
      return <HeartIcon className="w-5 h-5" />;
    case privateRoutes.clubConfig:
      return <Cog6ToothIcon className="w-5 h-5" />;
    case privateRoutes.photoGallery:
      return <PhotoIcon className="w-5 h-5" />;
    case privateRoutes.clubs:
      return <BuildingOfficeIcon className="w-5 h-5" />;
    case privateRoutes.clubCategories:
      return <BuildingOfficeIcon className="w-5 h-5" />;
    case privateRoutes.videos:
      return <VideoCameraIcon className="w-5 h-5" />;
    case privateRoutes.userRoles:
      return <ShieldCheckIcon className="w-5 h-5" />;
    case privateRoutes.meetingMinutes:
      return <ClipboardDocumentListIcon className="w-5 h-5" />;
    default:
      return <Cog6ToothIcon className="w-5 h-5" />;
  }
};

export const UnifiedSidebar = ({
  variant,
  sidebarContext,
}: UnifiedSidebarProps) => {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );

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
    if (variant === "admin") {
      const items = routes.filter(
        (item) => item.isPrivate === true && !item.hidden
      );

      // Group items by group property
      const groupedItems = items.reduce((acc, item) => {
        const group = item.group || "other";
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(item);
        return acc;
      }, {} as Record<string, typeof items>);

      return {
        title: translations.admin.title,
        subtitle: "Administrace",
        icon: <TrophyIcon className="w-6 h-6 text-white" />,
        iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
        groupedItems,
        groupLabels: {
          "team-management": "Správa týmů",
          "user-management": "Správa uživatelů",
          "members-management": "Správa členů",
          "club-management": "Správa klubu",
          other: "Ostatní",
        },
        footer: {
          title: "TJ Sokol Svinov",
          subtitle: "Administrace",
        },
      };
    } else {
      return {
        title: "Trenérský Portal",
        subtitle: "",
        icon: (
          <AcademicCapIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
        ),
        iconBg: "",
        groupedItems: { main: coachesRoutes },
        groupLabels: {},
        footer: {
          title: "TJ Sokol Svinov",
          subtitle: "Trenérský Portal",
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
    if (variant === "admin") {
      return {
        container: `fixed left-0 top-0 h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white transition-all duration-300 ease-in-out z-50 shadow-xl flex flex-col ${
          isCollapsed ? "w-16" : "w-64"
        }`,
        mobileContainer: `fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white w-80 max-w-[85vw] z-50 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col`,
        header:
          "flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm h-20",
        navItem: (isActive: boolean) =>
          `group flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-r-2 border-blue-600 dark:border-blue-400"
              : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
          }`,
        navItemIcon: (isActive: boolean) =>
          `w-5 h-5 ${isCollapsed ? "mx-auto" : "mr-3"}`,
        footer: "p-4 border-t border-gray-700 bg-gray-800/30",
        groupHeader:
          "w-full px-3 py-2 flex items-center justify-between hover:bg-gray-700/30 rounded-lg transition-colors duration-200",
        groupLabel:
          "text-xs font-semibold text-gray-400 uppercase tracking-wider",
        divider: "mx-3 border-t border-gray-700/50",
      };
    } else {
      return {
        container: `fixed top-0 left-0 z-50 h-screen bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out flex flex-col ${
          isCollapsed ? "w-16" : "w-64"
        }`,
        mobileContainer: `fixed top-0 left-0 z-50 h-full bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out flex flex-col ${
          isCollapsed ? "w-16" : "w-64"
        }`,
        header:
          "flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 h-20",
        navItem: (isActive: boolean) =>
          `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-r-2 border-green-600 dark:border-green-400"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
          }`,
        navItemIcon: (isActive: boolean) =>
          `w-5 h-5 ${isCollapsed ? "mx-auto" : "mr-3"}`,
        footer: "p-4 border-t border-gray-200 dark:border-gray-700 mt-auto",
        groupHeader: "",
        groupLabel: "",
        divider: "",
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
        <aside
          className={
            variant === "admin"
              ? classes.mobileContainer
              : `${classes.mobileContainer} ${
                  isCollapsed ? "-translate-x-full" : "translate-x-0"
                }`
          }
        >
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
                    variant === "admin"
                      ? "text-white"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {config.title}
                </h1>
                {config.subtitle && (
                  <p
                    className={`text-xs ${
                      variant === "admin"
                        ? "text-gray-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {config.subtitle}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => sidebarContext?.setIsMobileOpen?.(false)}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                variant === "admin"
                  ? "hover:bg-gray-700/50"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              title="Zavřít menu"
            >
              <ChevronRightIcon
                className={`w-6 h-6 ${
                  variant === "admin"
                    ? "text-white"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav
            className="flex-1 py-4 overflow-y-auto scrollbar-hide"
            style={{ 
              minHeight: 0,
              height: 'calc(100vh - 140px)' // Fixed height for proper scrolling (80px header + 60px footer)
            }}
          >
            <div className="space-y-4 px-3">
              {Object.entries(config.groupedItems).map(
                ([groupKey, groupItems], groupIndex) => (
                  <div key={groupKey} className="space-y-2">
                    {/* Group Header - Admin only */}
                    {variant === "admin" && groupKey !== "other" && (
                      <button
                        onClick={() => toggleGroup(groupKey)}
                        className={classes.groupHeader}
                      >
                        <h3 className={classes.groupLabel}>
                          {
                            config.groupLabels[
                              groupKey as keyof typeof config.groupLabels
                            ]
                          }
                        </h3>
                        {collapsedGroups.has(groupKey) ? (
                          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    )}

                    {/* Group Divider - Admin only */}
                    {variant === "admin" &&
                      groupIndex > 0 &&
                      groupKey !== "other" && (
                        <div className={classes.divider}></div>
                      )}

                    {/* Group Items */}
                    <div
                      className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        variant === "admin" && collapsedGroups.has(groupKey)
                          ? "max-h-0 opacity-0"
                          : "max-h-96 opacity-100"
                      }`}
                    >
                      {groupItems.map(
                        (item: AdminRouteItem | CoachRouteItem) => {
                          const isActive =
                            variant === "admin"
                              ? pathname === (item as AdminRouteItem).route
                              : pathname === (item as CoachRouteItem).href;
                          const icon =
                            variant === "admin"
                              ? getAdminRouteIcon(
                                  (item as AdminRouteItem).route || ""
                                )
                              : React.createElement(
                                  (item as CoachRouteItem).icon,
                                  { className: "w-5 h-5" }
                                );

                          return (
                            <Link
                              key={
                                variant === "admin"
                                  ? (item as AdminRouteItem).route
                                  : (item as CoachRouteItem).href
                              }
                              href={
                                variant === "admin"
                                  ? (item as AdminRouteItem).route ||
                                    privateRoutes.admin
                                  : (item as CoachRouteItem).href ||
                                    "/coaches/dashboard"
                              }
                              onClick={handleNavClick}
                              className={classes.navItem(isActive)}
                              title={
                                isCollapsed
                                  ? variant === "admin"
                                    ? (item as AdminRouteItem).title
                                    : (item as CoachRouteItem).name
                                  : undefined
                              }
                            >

                              <div
                                className={`flex items-center relative z-10 ${
                                  isCollapsed
                                    ? "justify-center w-full"
                                    : "space-x-3"
                                }`}
                              >
                                <div className={classes.navItemIcon(isActive)}>
                                  {icon}
                                </div>
                                {!isCollapsed && (
                                  <span className="text-sm font-medium">
                                    {variant === "admin"
                                      ? (item as AdminRouteItem).title
                                      : (item as CoachRouteItem).name}
                                  </span>
                                )}
                              </div>

                            </Link>
                          );
                        }
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </nav>

          {/* Mobile Footer */}
          <div className={classes.footer}>
            <div className="text-center">
              <div
                className={`text-xs mb-1 ${
                  variant === "admin"
                    ? "text-gray-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {config.footer.title}
              </div>
              {config.footer.subtitle && (
                <div
                  className={`text-xs ${
                    variant === "admin"
                      ? "text-gray-500"
                      : "text-gray-400 dark:text-gray-500"
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
        variant === "coach" ? "lg:translate-x-0" : "hidden lg:block"
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
                  variant === "admin"
                    ? "text-white"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {config.title}
              </h1>
              {config.subtitle && (
                <p
                  className={`text-xs ${
                    variant === "admin"
                      ? "text-gray-400"
                      : "text-gray-500 dark:text-gray-400"
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
            sidebarContext?.toggleSidebar?.() ||
            sidebarContext?.setIsCollapsed?.(!isCollapsed)
          }
          className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
            variant === "admin"
              ? "hover:bg-gray-700/50"
              : "hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          title={isCollapsed ? "Rozbalit menu" : "Sbalit menu"}
        >
          {isCollapsed ? (
            <ChevronDoubleRightIcon
              className={`w-5 h-5 ${
                variant === "admin"
                  ? "text-white"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            />
          ) : (
            <ChevronDoubleLeftIcon
              className={`w-5 h-5 ${
                variant === "admin"
                  ? "text-white"
                  : "text-gray-600 dark:text-gray-300"
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
          height: 'calc(100vh - 140px)' // Fixed height for proper scrolling (80px header + 60px footer)
        }}
      >
        <div className="space-y-4 px-3">
          {Object.entries(config.groupedItems).map(
            ([groupKey, groupItems], groupIndex) => (
              <div key={groupKey} className="space-y-2">
                {/* Group Header - Admin only */}
                {variant === "admin" &&
                  groupKey !== "other" &&
                  !isCollapsed && (
                    <button
                      onClick={() => toggleGroup(groupKey)}
                      className={classes.groupHeader}
                    >
                      <h3 className={classes.groupLabel}>
                        {
                          config.groupLabels[
                            groupKey as keyof typeof config.groupLabels
                          ]
                        }
                      </h3>
                      {collapsedGroups.has(groupKey) ? (
                        <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  )}

                {/* Group Divider - Admin only */}
                {variant === "admin" &&
                  groupIndex > 0 &&
                  groupKey !== "other" &&
                  !isCollapsed && <div className={classes.divider}></div>}

                {/* Group Items */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    variant === "admin" && collapsedGroups.has(groupKey)
                      ? "max-h-0 opacity-0"
                      : "max-h-96 opacity-100"
                  }`}
                >
                  {groupItems.map((item: AdminRouteItem | CoachRouteItem) => {
                    const isActive =
                      variant === "admin"
                        ? pathname === (item as AdminRouteItem).route
                        : pathname === (item as CoachRouteItem).href;
                    const icon =
                      variant === "admin"
                        ? getAdminRouteIcon(
                            (item as AdminRouteItem).route || ""
                          )
                        : React.createElement((item as CoachRouteItem).icon, {
                            className: "w-5 h-5",
                          });

                    return (
                      <Link
                        key={
                          variant === "admin"
                            ? (item as AdminRouteItem).route
                            : (item as CoachRouteItem).href
                        }
                        href={
                          variant === "admin"
                            ? (item as AdminRouteItem).route ||
                              privateRoutes.admin
                            : (item as CoachRouteItem).href ||
                              "/coaches/dashboard"
                        }
                        className={classes.navItem(isActive)}
                        title={
                          isCollapsed
                            ? variant === "admin"
                              ? (item as AdminRouteItem).title
                              : (item as CoachRouteItem).name
                            : undefined
                        }
                      >

                        <div
                          className={`flex items-center relative z-10 ${
                            isCollapsed ? "justify-center w-full" : "space-x-3"
                          }`}
                        >
                          <div className={classes.navItemIcon(isActive)}>
                            {icon}
                          </div>
                          {!isCollapsed && (
                            <span className="text-sm font-medium">
                              {variant === "admin"
                                ? (item as AdminRouteItem).title
                                : (item as CoachRouteItem).name}
                            </span>
                          )}
                        </div>

                      </Link>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className={classes.footer}>
        <div className="text-center">
          <div
            className={`text-xs mb-1 ${
              variant === "admin"
                ? "text-gray-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {config.footer.title}
          </div>
          {config.footer.subtitle && (
            <div
              className={`text-xs ${
                variant === "admin"
                  ? "text-gray-500"
                  : "text-gray-400 dark:text-gray-500"
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

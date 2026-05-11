import React from 'react';

import {
  BuildingOfficeIcon,
  CalendarIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CogIcon,
  DocumentTextIcon,
  HeartIcon,
  HomeIcon,
  PhotoIcon,
  ShieldCheckIcon,
  TagIcon,
  TrophyIcon,
  UserGroupIcon,
  UsersIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

import {APP_ROUTES} from '@/lib/app-routes';
import {translations} from '@/lib/translations';

export interface MenuItem {
  title: string;
  href?: string;
  children?: MenuItem[];
  description?: string;
  isPrivate?: boolean;
  hidden?: boolean;
  group?: RouteGroups;
}

export interface NavMenuItem extends MenuItem {
  icon?: React.ComponentType<{className?: string}>;
}

export enum RouteGroups {
  TEAM = 'team-management',
  MEMBER = 'member-management',
  USER = 'user-management',
  CLUB = 'club-management',
  OTHER = 'other',
}

export const coachesNavRoutes: NavMenuItem[] = [
  {
    title: translations.coachPortal.routes.dashboard,
    href: APP_ROUTES.coaches.dashboard,
    icon: HomeIcon,
  },
  {
    title: translations.coachPortal.routes.matches,
    href: APP_ROUTES.coaches.matches,
    icon: ClipboardDocumentListIcon,
  },
  {
    title: translations.coachPortal.routes.lineups,
    href: APP_ROUTES.coaches.lineups,
    icon: UserGroupIcon,
  },
  {
    title: translations.coachPortal.routes.attendance,
    href: APP_ROUTES.coaches.attendance,
    icon: ClipboardDocumentListIcon,
  },
  {
    title: translations.coachPortal.routes.members,
    href: APP_ROUTES.coaches.members,
    icon: UsersIcon,
  },
  {
    title: translations.coachPortal.routes.videos,
    href: APP_ROUTES.coaches.recordings,
    icon: VideoCameraIcon,
  },
  {
    title: translations.coachPortal.routes.statistics,
    href: APP_ROUTES.coaches.statistics,
    icon: ChartBarIcon,
  },
  {
    title: translations.coachPortal.routes.meetingMinutes,
    href: APP_ROUTES.coaches.meetingMinutes,
    icon: ClipboardDocumentListIcon,
  },
  {
    title: translations.coachPortal.routes.profile,
    href: APP_ROUTES.coaches.profile,
    icon: UsersIcon,
  },
];

export const allRoutes: NavMenuItem[] = [
  {href: APP_ROUTES.auth.login, title: translations.auth.login.title},
  {
    href: APP_ROUTES.admin.root,
    title: translations.admin.root.title,
    isPrivate: true,
    description: translations.admin.root.description,
    icon: HomeIcon,
  },
  {
    href: APP_ROUTES.admin.committees,
    title: translations.committees.page.title,
    isPrivate: true,
    description: translations.committees.page.description,
    group: RouteGroups.TEAM,
    icon: BuildingOfficeIcon,
  },
  {
    href: APP_ROUTES.admin.matches,
    title: translations.matches.page.title,
    isPrivate: true,
    description: translations.matches.page.description,
    group: RouteGroups.TEAM,
    icon: TrophyIcon,
  },
  {
    href: APP_ROUTES.admin.tournaments,
    title: translations.tournaments.page.title,
    isPrivate: true,
    description: translations.tournaments.page.description,
    group: RouteGroups.TEAM,
    icon: TrophyIcon,
  },
  {
    href: APP_ROUTES.admin.members,
    title: translations.members.page.title,
    isPrivate: true,
    description: translations.members.page.description,
    group: RouteGroups.MEMBER,
    icon: UsersIcon,
  },
  {
    href: APP_ROUTES.admin.memberFunctions,
    title: translations.memberFunctions.page.title,
    isPrivate: true,
    description: translations.memberFunctions.page.description,
    group: RouteGroups.MEMBER,
    icon: CogIcon,
  },
  {
    href: APP_ROUTES.admin.seasons,
    title: translations.seasons.page.title,
    isPrivate: true,
    description: translations.seasons.page.description,
    group: RouteGroups.TEAM,
    icon: CalendarIcon,
  },
  {
    href: APP_ROUTES.admin.categories,
    title: translations.categories.page.title,
    isPrivate: true,
    description: translations.categories.page.description,
    group: RouteGroups.TEAM,
    icon: TagIcon,
  },
  {
    href: APP_ROUTES.admin.posts,
    title: translations.blogPosts.page.title,
    isPrivate: true,
    description: translations.blogPosts.page.description,
    icon: DocumentTextIcon,
  },
  {
    href: APP_ROUTES.admin.users,
    title: translations.users.page.title,
    isPrivate: true,
    description: translations.users.page.description,
    group: RouteGroups.USER,
    icon: UsersIcon,
  },
  {
    href: APP_ROUTES.admin.sponsorship,
    title: translations.sponsorship.page.title,
    isPrivate: true,
    description: translations.sponsorship.page.description,
    group: RouteGroups.CLUB,
    icon: HeartIcon,
  },
  {
    href: APP_ROUTES.admin.clubConfig,
    title: translations.clubConfig.page.title,
    isPrivate: true,
    description: translations.clubConfig.page.description,
    group: RouteGroups.CLUB,
    icon: Cog6ToothIcon,
  },
  {
    href: APP_ROUTES.admin.photoGallery,
    title: translations.photoGallery.page.title,
    isPrivate: true,
    description: translations.photoGallery.page.description,
    icon: PhotoIcon,
  },
  {
    href: APP_ROUTES.admin.clubs,
    title: translations.clubs.page.title,
    isPrivate: true,
    description: translations.clubs.page.description,
    group: RouteGroups.TEAM,
    icon: BuildingOfficeIcon,
  },
  {
    href: APP_ROUTES.admin.clubCategories,
    title: translations.clubCategories.page.title,
    isPrivate: true,
    description: translations.clubCategories.page.description,
    group: RouteGroups.TEAM,
    icon: BuildingOfficeIcon,
  },
  {
    href: APP_ROUTES.admin.recordings,
    title: translations.matchRecordings.page.title,
    isPrivate: true,
    description: translations.matchRecordings.page.description,
    icon: VideoCameraIcon,
  },
  {
    href: APP_ROUTES.admin.userRoles,
    title: translations.userRoles.page.title,
    isPrivate: true,
    description: translations.userRoles.page.description,
    group: RouteGroups.USER,
    icon: ShieldCheckIcon,
  },
  {
    href: APP_ROUTES.admin.meetingMinutes,
    title: translations.meetingMinutes.page.title,
    isPrivate: true,
    description: translations.meetingMinutes.page.description,
    group: RouteGroups.CLUB,
    icon: ClipboardDocumentListIcon,
  },
  {
    href: APP_ROUTES.admin.grantCalendar,
    title: translations.grantCalendar.page.title,
    isPrivate: true,
    description: translations.grantCalendar.page.description,
    group: RouteGroups.CLUB,
    icon: CalendarIcon,
  },
];

export const findRouteByPath = (pathname: string): NavMenuItem | undefined =>
  allRoutes.find((route) => route.href === pathname);

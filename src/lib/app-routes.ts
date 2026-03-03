import {
  ChartBarIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations/index';

const COACH_ROOT = '/coaches';
const ADMIN_ROOT = '/admin';

export const APP_ROUTES = {
  // Public — no auth required
  public: {
    home: '/' as const,
    blog: '/blog' as const,
    blogPost: (slug: string) => `/blog/${slug}`,
    matches: '/matches' as const,
    match: (id: string | number) => `/matches/${id}`,
    photoGallery: '/photo-gallery' as const,
    chronicle: '/chronicle' as const,
    downloads: '/downloads' as const,
    contact: '/contact' as const,
    about: '/about' as const,
    celebration: '/100' as const,
    category: (id: string | number) => `/category/${id}`,
  },

  // Auth + error utility routes
  auth: {
    login: '/login' as const,
    setPassword: '/set-password' as const,
    resetPassword: '/reset-password' as const,
    error: '/error' as const,
    blocked: '/blocked' as const,
  },

  // Admin portal
  admin: {
    root: `${ADMIN_ROOT}` as const,
    users: `${ADMIN_ROOT}/users` as const,
    posts: `${ADMIN_ROOT}/posts` as const,
    categories: `${ADMIN_ROOT}/categories` as const,
    seasons: `${ADMIN_ROOT}/seasons` as const,
    matches: `${ADMIN_ROOT}/matches` as const,
    members: `${ADMIN_ROOT}/members` as const,
    memberFunctions: `${ADMIN_ROOT}/member-functions` as const,
    committees: `${ADMIN_ROOT}/committees` as const,
    sponsorship: `${ADMIN_ROOT}/sponsorship` as const,
    clubConfig: `${ADMIN_ROOT}/club-config` as const,
    photoGallery: `${ADMIN_ROOT}/photo-gallery` as const,
    clubs: `${ADMIN_ROOT}/clubs` as const,
    club: (id: string | number) => `${ADMIN_ROOT}/clubs/${id}`,
    clubNew: `${ADMIN_ROOT}/clubs/new` as const,
    clubCategories: `${ADMIN_ROOT}/club-categories` as const,
    videos: `${ADMIN_ROOT}/videos` as const,
    userRoles: `${ADMIN_ROOT}/user-roles` as const,
    meetingMinutes: `${ADMIN_ROOT}/meeting-minutes` as const,
    grantCalendar: `${ADMIN_ROOT}/grant-calendar` as const,
  },

  // Coach portal
  coaches: {
    root: `${COACH_ROOT}` as const,
    dashboard: `${COACH_ROOT}/dashboard` as const,
    attendance: `${COACH_ROOT}/attendance` as const,
    matches: `${COACH_ROOT}/matches` as const,
    members: `${COACH_ROOT}/members` as const,
    statistics: `${COACH_ROOT}/statistics` as const,
    lineups: `${COACH_ROOT}/lineups` as const,
    videos: `${COACH_ROOT}/videos` as const,
    meetingMinutes: `${COACH_ROOT}/meeting-minutes` as const,
    profile: `${COACH_ROOT}/profile` as const,
    login: '/login?tab=coach' as const,
  },
} as const;

export const coachesNavRoutes = [
  {
    name: translations.coachPortal.routes.dashboard,
    href: APP_ROUTES.coaches.dashboard,
    icon: HomeIcon,
  },
  {
    name: translations.coachPortal.routes.matches,
    href: APP_ROUTES.coaches.matches,
    icon: ClipboardDocumentListIcon,
  },
  {
    name: translations.coachPortal.routes.lineups,
    href: APP_ROUTES.coaches.lineups,
    icon: UserGroupIcon,
  },
  {
    name: translations.coachPortal.routes.attendance,
    href: APP_ROUTES.coaches.attendance,
    icon: ClipboardDocumentListIcon,
  },
  {
    name: translations.coachPortal.routes.members,
    href: APP_ROUTES.coaches.members,
    icon: UsersIcon,
  },
  {
    name: translations.coachPortal.routes.videos,
    href: APP_ROUTES.coaches.videos,
    icon: VideoCameraIcon,
  },
  {
    name: translations.coachPortal.routes.statistics,
    href: APP_ROUTES.coaches.statistics,
    icon: ChartBarIcon,
  },
  {
    name: translations.coachPortal.routes.meetingMinutes,
    href: APP_ROUTES.coaches.meetingMinutes,
    icon: ClipboardDocumentListIcon,
  },
  {
    name: translations.coachPortal.routes.profile,
    href: APP_ROUTES.coaches.profile,
    icon: UsersIcon,
  },
];

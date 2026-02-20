import {
  ChartBarIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations/index';

const COACH_PORTAL_BASE = '/coaches';

export const coachesRoutes = [
  {
    name: translations.coachPortal.routes.dashboard,
    href: `${COACH_PORTAL_BASE}/dashboard`,
    icon: HomeIcon,
  },
  {
    name: translations.coachPortal.routes.matches,
    href: `${COACH_PORTAL_BASE}/matches`,
    icon: ClipboardDocumentListIcon,
  },
  {
    name: translations.coachPortal.routes.lineups,
    href: `${COACH_PORTAL_BASE}/lineups`,
    icon: UserGroupIcon,
  },
  {
    name: translations.coachPortal.routes.attendance,
    href: `${COACH_PORTAL_BASE}/attendance`,
    icon: ClipboardDocumentListIcon,
  },
  {
    name: translations.coachPortal.routes.members,
    href: `${COACH_PORTAL_BASE}/members`,
    icon: UsersIcon,
  },
  {
    name: translations.coachPortal.routes.videos,
    href: `${COACH_PORTAL_BASE}/video`,
    icon: VideoCameraIcon,
  },
  {
    name: translations.coachPortal.routes.statistics,
    href: `${COACH_PORTAL_BASE}/statistics`,
    icon: ChartBarIcon,
  },
  {
    name: translations.coachPortal.routes.meetingMinutes,
    href: `${COACH_PORTAL_BASE}/meeting-minutes`,
    icon: ClipboardDocumentListIcon,
  },
  {
    name: translations.coachPortal.routes.profile,
    href: `${COACH_PORTAL_BASE}/profile`,
    icon: UsersIcon,
  },
];

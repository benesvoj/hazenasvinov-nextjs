import { ChartBarIcon, HomeIcon, UserGroupIcon, VideoCameraIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { translations } from "@/lib/translations";

export const coachesRoutes = [
    {
      name: translations.coaches.routes.dashboard,
      href: '/coaches/dashboard',
      icon: HomeIcon,
    },
    {
      name: translations.coaches.routes.teams,
      href: '/coaches/teams',
      icon: UserGroupIcon,
    },
    {
      name: translations.coaches.routes.videos,
      href: '/coaches/videos',
      icon: VideoCameraIcon,
    },
    {
      name: translations.coaches.routes.attendance,
      href: '/coaches/attendance',
      icon: ClipboardDocumentListIcon,
    },
    {
      name: translations.coaches.routes.statistics,
      href: '/coaches/statistics',
      icon: ChartBarIcon,
    },
    {
      name: translations.coaches.routes.meetingMinutes,
      href: '/coaches/meeting-minutes',
      icon: ChartBarIcon,
    },
  ];
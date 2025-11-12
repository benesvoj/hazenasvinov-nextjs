import {translations} from '@/lib/translations';

export interface MenuItem {
  title: string;
  route?: string;
  children?: MenuItem[];
  description?: string;
  isPrivate?: boolean;
  hidden?: boolean;
  group?: string;
}

/**
 * Public routes
 * @deprecated Use dynamic routes instead
 * @see dynamicRoutes.ts
 * @see routes.ts
 * @todo: remove this after migration
 */
export const publicRoutes = {
  home: '/',
  error: '/error',
  chronicle: '/chronicle',
  downloads: '/downloads',
  contact: '/contact',
  about: '/about',
  celebration: '/100',
  blog: '/blog',
  login: '/login',
  setPassword: '/set-password',
  matches: '/matches',
  photoGallery: '/photo-gallery',
  youngestKids: '/category/[id]',
  prepKids: '/category/[id]',
  youngerBoys: '/category/[id]',
  youngerGirls: '/category/[id]',
  olderBoys: '/category/[id]',
  olderGirls: '/category/[id]',
  juniorBoys: '/category/[id]',
  juniorGirls: '/category/[id]',
  men: '/category/[id]',
  women: '/category/[id]',
} as const;

export const privateRoutes = {
  admin: '/admin',
  users: '/admin/users',
  posts: '/admin/posts',
  categories: '/admin/categories',
  seasons: '/admin/seasons',
  matches: '/admin/matches',
  members: '/admin/members',
  memberFunctions: '/admin/member-functions',
  committees: '/admin/committees',
  sponsorship: '/admin/sponsorship',
  clubConfig: '/admin/clubConfig',
  photoGallery: '/admin/photo-gallery',
  clubs: '/admin/clubs',
  clubCategories: '/admin/club-categories',
  videos: '/admin/videos',
  userRoles: '/admin/user-roles',
  meetingMinutes: '/admin/meeting-minutes',
  grantCalendar: '/admin/grant-calendar',
};

const routes: MenuItem[] = [
  {route: publicRoutes.home, title: translations.landingPage.title},
  {
    title: 'Kategorie',
    children: [
      {
        title: 'Kuřátka',
        route: publicRoutes.youngestKids,
        description: 'Nejmladší se zájmem o pohyb',
      },
      {
        title: 'Přípravka',
        route: publicRoutes.prepKids,
        description: 'Děti 5--10 let, turnajové kategorie',
      },
      {
        title: 'Mladší žáci',
        route: publicRoutes.youngerBoys,
        description: 'Kluci 9 - 12 let, SM oblast',
      },
      {
        title: 'Mladší žáčky',
        route: publicRoutes.youngerGirls,
        description: 'Devčata 9 - 12 let, SM oblast',
      },
      {
        title: 'Starší žáci',
        route: publicRoutes.olderBoys,
        description: 'Kluci 12 - 15 let, SM oblast',
      },
      {
        title: 'Starší žáčky',
        route: publicRoutes.olderGirls,
        description: 'Devčata 12 - 15 let, SM oblast',
      },
      {
        title: 'Dorostenci',
        route: publicRoutes.juniorBoys,
        description: 'Junioři 15 - 18 let, SM oblast',
      },
      {
        title: 'Dorostenky',
        route: publicRoutes.juniorGirls,
        description: 'Juniorky 15 - 18 let, SM oblast',
      },
      {
        title: 'Muži',
        route: publicRoutes.men,
        description: '1.liga mužů, SM oblast',
      },
      {
        title: 'Ženy',
        route: publicRoutes.women,
        description: 'Oblastní liga žen, SM oblast',
      },
    ],
  },
  {route: publicRoutes.blog, title: 'Novinky'},
  {route: publicRoutes.matches, title: 'Zápasy'},
  {route: publicRoutes.photoGallery, title: 'Fotogalerie'},
  {route: publicRoutes.chronicle, title: 'Kronika'},
  {route: publicRoutes.downloads, title: 'Dokumenty'},
  {route: publicRoutes.contact, title: 'Kontakt'},
  {route: publicRoutes.about, title: 'O oddílu'},
  {route: publicRoutes.celebration, title: '100 let'},
  {route: publicRoutes.login, title: 'Admin'},
  {
    route: privateRoutes.admin,
    title: 'Dashboard',
    isPrivate: true,
    description: 'Správa obsahu a nastavení systému.',
  },
  {
    route: privateRoutes.committees,
    title: 'Komise',
    isPrivate: true,
    description: 'Správa oblastních soutěžních komisí.',
    group: 'team-management',
  },
  {
    route: privateRoutes.matches,
    title: 'Zápasy',
    isPrivate: true,
    description: 'Správa zápasů, výsledků a tabulek pro všechny kategorie.',
    group: 'team-management',
  },
  {
    route: privateRoutes.members,
    title: 'Členové',
    isPrivate: true,
    description: 'Správa členů klubu - přidávání, úprava a mazání členů.',
    group: 'members-management',
  },
  {
    route: privateRoutes.memberFunctions,
    title: 'Funkce členů',
    isPrivate: true,
    description: 'Správa funkcí členů klubu - přidávání, úprava a mazání funkcí.',
    group: 'members-management',
  },
  {
    route: privateRoutes.seasons,
    title: translations.seasons.title,
    isPrivate: true,
    description: translations.seasons.description,
    group: 'team-management',
  },
  {
    route: privateRoutes.categories,
    title: 'Kategorie',
    isPrivate: true,
    description: 'Správa kategorií pro týmové soutěže a členy klubu.',
    group: 'team-management',
  },
  {
    route: privateRoutes.posts,
    title: 'Blog',
    isPrivate: true,
    description: 'Správa blogových článků a novinek.',
  },
  {
    route: privateRoutes.users,
    title: 'Uživatelé',
    isPrivate: true,
    description: 'Správa uživatelů, kteří se mohou přihlásit do systému.',
    group: 'user-management',
  },
  {
    route: privateRoutes.sponsorship,
    title: 'Sponzorství',
    isPrivate: true,
    description: 'Správa sponzorů, partnerů a sponzorských balíčků.',
    group: 'club-management',
  },
  {
    route: privateRoutes.clubConfig,
    title: 'Konfigurace klubu',
    isPrivate: true,
    description: 'Správa nastavení a konfigurace klubu.',
    group: 'club-management',
  },
  {
    route: privateRoutes.photoGallery,
    title: 'Fotogalerie',
    isPrivate: true,
    description: 'Správa fotoalb a fotografií.',
  },
  {
    route: privateRoutes.clubs,
    title: 'Kluby',
    isPrivate: true,
    description: 'Správa klubů a jejich týmů.',
    group: 'team-management',
  },
  {
    route: privateRoutes.clubCategories,
    title: 'Přiřazení klubů',
    isPrivate: true,
    description: 'Správa přiřazení klubů ke kategoriím pro různé sezóny.',
    group: 'team-management',
  },
  {
    route: privateRoutes.videos,
    title: 'Videa',
    isPrivate: true,
    description: 'Správa videí pro jednotlivé kategorie.',
  },
  {
    route: privateRoutes.userRoles,
    title: 'Uživatelské role',
    isPrivate: true,
    description: 'Správa rolí a oprávnění uživatelů.',
    group: 'user-management',
  },
  {
    route: privateRoutes.meetingMinutes,
    title: 'Zápisy z výborových schůzí',
    isPrivate: true,
    description: 'Správa zápisů z výborových schůzí a jejich účastníků.',
    group: 'club-management',
  },
  {
    route: privateRoutes.grantCalendar,
    title: 'Kalendář dotací',
    isPrivate: true,
    description: 'Správa dotací a jejich termínů.',
    group: 'club-management',
  },
];

export default routes;

import {translations} from '@/lib/translations/index';

import {APP_ROUTES} from '@/lib';

export interface MenuItem {
  title: string;
  route?: string;
  children?: MenuItem[];
  description?: string;
  isPrivate?: boolean;
  hidden?: boolean;
  group?: string;
}

const routes: MenuItem[] = [
  {route: APP_ROUTES.public.home, title: translations.public.landingPage.title},
  {
    title: 'Kategorie',
    children: [
      {
        title: 'Kuřátka',
        route: APP_ROUTES.public.category('youngestKids'),
        description: 'Nejmladší se zájmem o pohyb',
      },
      {
        title: 'Přípravka',
        route: APP_ROUTES.public.category('prepKids'),
        description: 'Děti 5--10 let, turnajové kategorie',
      },
      {
        title: 'Mladší žáci',
        route: APP_ROUTES.public.category('youngerBoys'),
        description: 'Kluci 9 - 12 let, SM oblast',
      },
      {
        title: 'Mladší žáčky',
        route: APP_ROUTES.public.category('youngerGirls'),
        description: 'Devčata 9 - 12 let, SM oblast',
      },
      {
        title: 'Starší žáci',
        route: APP_ROUTES.public.category('olderBoys'),
        description: 'Kluci 12 - 15 let, SM oblast',
      },
      {
        title: 'Starší žáčky',
        route: APP_ROUTES.public.category('olderGirls'),
        description: 'Devčata 12 - 15 let, SM oblast',
      },
      {
        title: 'Dorostenci',
        route: APP_ROUTES.public.category('juniorBoys'),
        description: 'Junioři 15 - 18 let, SM oblast',
      },
      {
        title: 'Dorostenky',
        route: APP_ROUTES.public.category('juniorGirls'),
        description: 'Juniorky 15 - 18 let, SM oblast',
      },
      {
        title: 'Muži',
        route: APP_ROUTES.public.category('men'),
        description: '1.liga mužů, SM oblast',
      },
      {
        title: 'Ženy',
        route: APP_ROUTES.public.category('women'),
        description: 'Oblastní liga žen, SM oblast',
      },
    ],
  },
  {route: APP_ROUTES.public.blog, title: 'Novinky'},
  {route: APP_ROUTES.public.matches, title: 'Zápasy'},
  {route: APP_ROUTES.public.photoGallery, title: 'Fotogalerie'},
  {route: APP_ROUTES.public.chronicle, title: 'Kronika'},
  {route: APP_ROUTES.public.downloads, title: 'Dokumenty'},
  {route: APP_ROUTES.public.contact, title: 'Kontakt'},
  {route: APP_ROUTES.public.about, title: 'O oddílu'},
  {route: APP_ROUTES.public.celebration, title: '100 let'},
  {route: APP_ROUTES.auth.login, title: 'Admin'},
  {
    route: APP_ROUTES.admin.root,
    title: 'Dashboard',
    isPrivate: true,
    description: 'Správa obsahu a nastavení systému.',
  },
  {
    route: APP_ROUTES.admin.committees,
    title: 'Komise',
    isPrivate: true,
    description: 'Správa oblastních soutěžních komisí.',
    group: 'team-management',
  },
  {
    route: APP_ROUTES.admin.matches,
    title: 'Zápasy',
    isPrivate: true,
    description: 'Správa zápasů, výsledků a tabulek pro všechny kategorie.',
    group: 'team-management',
  },
  {
    route: APP_ROUTES.admin.members,
    title: 'Členové',
    isPrivate: true,
    description: 'Správa členů klubu - přidávání, úprava a mazání členů.',
    group: 'members-management',
  },
  {
    route: APP_ROUTES.admin.memberFunctions,
    title: 'Funkce členů',
    isPrivate: true,
    description: 'Správa funkcí členů klubu - přidávání, úprava a mazání funkcí.',
    group: 'members-management',
  },
  {
    route: APP_ROUTES.admin.seasons,
    title: translations.seasons.title,
    isPrivate: true,
    description: translations.seasons.description,
    group: 'team-management',
  },
  {
    route: APP_ROUTES.admin.categories,
    title: 'Kategorie',
    isPrivate: true,
    description: 'Správa kategorií pro týmové soutěže a členy klubu.',
    group: 'team-management',
  },
  {
    route: APP_ROUTES.admin.posts,
    title: 'Blog',
    isPrivate: true,
    description: 'Správa blogových článků a novinek.',
  },
  {
    route: APP_ROUTES.admin.users,
    title: 'Uživatelé',
    isPrivate: true,
    description: 'Správa uživatelů, kteří se mohou přihlásit do systému.',
    group: 'user-management',
  },
  {
    route: APP_ROUTES.admin.sponsorship,
    title: 'Sponzorství',
    isPrivate: true,
    description: 'Správa sponzorů, partnerů a sponzorských balíčků.',
    group: 'club-management',
  },
  {
    route: APP_ROUTES.admin.clubConfig,
    title: 'Konfigurace klubu',
    isPrivate: true,
    description: 'Správa nastavení a konfigurace klubu.',
    group: 'club-management',
  },
  {
    route: APP_ROUTES.admin.photoGallery,
    title: 'Fotogalerie',
    isPrivate: true,
    description: 'Správa fotoalb a fotografií.',
  },
  {
    route: APP_ROUTES.admin.clubs,
    title: 'Kluby',
    isPrivate: true,
    description: 'Správa klubů a jejich týmů.',
    group: 'team-management',
  },
  {
    route: APP_ROUTES.admin.clubCategories,
    title: 'Přiřazení klubů',
    isPrivate: true,
    description: 'Správa přiřazení klubů ke kategoriím pro různé sezóny.',
    group: 'team-management',
  },
  {
    route: APP_ROUTES.admin.videos,
    title: 'Videa',
    isPrivate: true,
    description: 'Správa videí pro jednotlivé kategorie.',
  },
  {
    route: APP_ROUTES.admin.userRoles,
    title: 'Uživatelské role',
    isPrivate: true,
    description: 'Správa rolí a oprávnění uživatelů.',
    group: 'user-management',
  },
  {
    route: APP_ROUTES.admin.meetingMinutes,
    title: 'Zápisy z výborových schůzí',
    isPrivate: true,
    description: 'Správa zápisů z výborových schůzí a jejich účastníků.',
    group: 'club-management',
  },
  {
    route: APP_ROUTES.admin.grantCalendar,
    title: 'Kalendář dotací',
    isPrivate: true,
    description: 'Správa dotací a jejich termínů.',
    group: 'club-management',
  },
];

export default routes;

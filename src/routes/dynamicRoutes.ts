import {PageVisibility} from '@/types';

export interface MenuItem {
  title: string;
  route?: string;
  children?: MenuItem[];
  description?: string;
  isPrivate?: boolean;
  hidden?: boolean;
}

// Function to build menu items from page visibility data
export const buildMenuFromPages = (pages: PageVisibility[]): MenuItem[] => {
  const menuItems: MenuItem[] = [];

  // Group pages by category
  const groupedPages = pages.reduce(
    (acc, page) => {
      const category = page.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(page);
      return acc;
    },
    {} as Record<string, PageVisibility[]>
  );

  // Build main navigation items
  if (groupedPages.main) {
    groupedPages.main.forEach((page) => {
      menuItems.push({
        title: page.page_title,
        route: page.page_route,
        description: page.page_description,
      });
    });
  }

  // Build category section if any category pages exist
  if (groupedPages.categories && groupedPages.categories.length > 0) {
    const categoryChildren = groupedPages.categories.map((page) => ({
      title: page.page_title,
      route: page.page_route,
      description: page.page_description,
    }));

    menuItems.push({
      title: 'Kategorie',
      children: categoryChildren,
    });
  }

  // Add info pages
  if (groupedPages.info) {
    groupedPages.info.forEach((page) => {
      menuItems.push({
        title: page.page_title,
        route: page.page_route,
        description: page.page_description,
      });
    });
  }

  // Add admin pages (respect database visibility)
  if (groupedPages.admin) {
    groupedPages.admin.forEach((page) => {
      menuItems.push({
        title: page.page_title,
        route: page.page_route,
        description: page.page_description,
      });
    });
  }

  return menuItems;
};

// Fallback routes in case database is not available
export const fallbackRoutes = {
  home: '/',
  error: '/error',
  chronicle: '/chronicle',
  downloads: '/downloads',
  contact: '/contact',
  about: '/about',
  celebration: '/100',
  blog: '/blog',
  login: '/login',
  matches: '/matches',
  photoGallery: '/photo-gallery',
  youngestKids: '/category/youngest-kids',
  prepKids: '/category/prep-kids',
  youngerBoys: '/category/younger-boys',
  youngerGirls: '/category/younger-girls',
  olderBoys: '/category/older-boys',
  olderGirls: '/category/older-girls',
  juniorBoys: '/category/junior-boys',
  juniorGirls: '/category/junior-girls',
  men: '/category/men',
  women: '/category/women',
} as const;

export const privateRoutes = {
  admin: '/admin',
  users: '/admin/users',
  posts: '/admin/posts',
  categories: '/admin/category',
  seasons: '/admin/seasons',
  teams: '/admin/teams',
  teamCategories: '/admin/team-category',
  matches: '/admin/matches',
  members: '/admin/members',
  memberFunctions: '/admin/member-functions',
  committees: '/admin/committees',
  competitions: '/admin/competitions',
  sponsorship: '/admin/sponsorship',
  clubConfig: '/admin/club-config',
  photoGallery: '/admin/photo-gallery',
};

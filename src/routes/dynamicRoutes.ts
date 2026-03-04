import {MenuItem, RouteGroups} from '@/lib/navigation';

import {PageVisibility} from '@/types';
import {hasItems} from '@/utils';

// Function to build menu items from page visibility data
export const buildMenuFromPages = (pages: PageVisibility[]): MenuItem[] => {
  const menuItems: MenuItem[] = [];

  // Group pages by category
  const groupedPages = pages.reduce(
    (acc, page) => {
      const category = page.category || RouteGroups.OTHER;
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
        href: page.page_route,
        description: page.page_description,
      });
    });
  }

  // Build category section if any category pages exist
  if (hasItems(groupedPages.categories)) {
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
        href: page.page_route,
        description: page.page_description,
      });
    });
  }

  // Add admin pages (respect database visibility)
  if (groupedPages.admin) {
    groupedPages.admin.forEach((page) => {
      menuItems.push({
        title: page.page_title,
        href: page.page_route,
        description: page.page_description,
      });
    });
  }

  return menuItems;
};

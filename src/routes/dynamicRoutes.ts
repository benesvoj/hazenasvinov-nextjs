import {MenuItem, RouteGroups} from '@/lib/navigation';

import {PageVisibility} from '@/types';
import {hasItems} from '@/utils';

// Function to build menu items from page visibility data
/**
 * @param pages               Visible pages, from `page_visibility`.
 * @param activeCategorySlugs Slugs of the categories the club fields this
 *   season. When given, the Kategorie section is narrowed to those. Omit it and
 *   every category page shows, which is the old behaviour.
 */
export const buildMenuFromPages = (
  pages: PageVisibility[],
  activeCategorySlugs?: Set<string>
): MenuItem[] => {
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
  //
  // Narrowed by season on top of page_visibility rather than instead of it.
  // The flag stays the way to hide a category page for any other reason — it is
  // what keeps Přípravka and Kuřátka out — while a category the club is not
  // entering this season now drops out on its own, and comes back when it is
  // entered again. Ženy was the case that prompted this: visible in the menu,
  // empty behind the link.
  const categoryPages = activeCategorySlugs
    ? (groupedPages.categories ?? []).filter((page) =>
        activeCategorySlugs.has(page.page_route.split('/').filter(Boolean).pop() ?? '')
      )
    : groupedPages.categories;

  if (hasItems(categoryPages)) {
    const categoryChildren = categoryPages.map((page) => ({
      title: page.page_title,
      href: page.page_route,
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

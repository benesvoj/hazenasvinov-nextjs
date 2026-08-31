import {describe, expect, it} from 'vitest';

import {buildMenuFromPages} from '@/routes/dynamicRoutes';
import {PageVisibility} from '@/types';

const page = (title: string, route: string, category: string): PageVisibility =>
  ({
    page_title: title,
    page_route: route,
    page_description: '',
    category,
    is_visible: true,
    is_active: true,
  }) as unknown as PageVisibility;

const pages = [
  page('Muži', '/categories/men', 'categories'),
  page('Ženy', '/categories/women', 'categories'),
  page('Dorostenci', '/categories/juniorBoys', 'categories'),
];

const categorySection = (items: ReturnType<typeof buildMenuFromPages>) =>
  items.find((item) => item.title === 'Kategorie');

describe('buildMenuFromPages', () => {
  it('keeps every category page when no season narrowing is given', () => {
    // The admin portal and anything without the active-category list still get
    // the whole menu.
    expect(categorySection(buildMenuFromPages(pages))?.children).toHaveLength(3);
  });

  it('drops a category the club is not fielding this season', () => {
    // Ženy is the case this exists for: visible in page_visibility, and empty
    // behind the link because the club is not entering it in 2026/2027.
    const section = categorySection(buildMenuFromPages(pages, new Set(['men', 'juniorBoys'])));

    expect(section?.children?.map((c) => c.title)).toEqual(['Muži', 'Dorostenci']);
  });

  it('leaves the section out entirely when nothing survives', () => {
    expect(categorySection(buildMenuFromPages(pages, new Set()))).toBeUndefined();
  });

  it('matches on the last path segment, not on a substring', () => {
    // '/categories/men' must not be matched by a slug like 'women'.
    const section = categorySection(buildMenuFromPages(pages, new Set(['women'])));

    expect(section?.children?.map((c) => c.title)).toEqual(['Ženy']);
  });
});

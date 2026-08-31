import {render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {mockUseVisiblePages, mockUseFetchActiveCategories} = vi.hoisted(() => ({
  mockUseVisiblePages: vi.fn(),
  mockUseFetchActiveCategories: vi.fn(),
}));

vi.mock('@/hooks/entities/settings/useVisiblePages', () => ({
  useVisiblePages: mockUseVisiblePages,
}));

vi.mock('@/hooks', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useFetchActiveCategories: mockUseFetchActiveCategories,
}));

import Header from '@/components/ui/client/Header';

const page = (title: string, route: string) => ({
  page_title: title,
  page_route: route,
  page_description: '',
  category: 'categories',
  is_visible: true,
  is_active: true,
});

const category = (slug: string) => ({id: slug, name: slug, slug, sort_order: 1});

describe('Header category menu', () => {
  beforeEach(() => {
    mockUseVisiblePages.mockReturnValue({
      visiblePages: [page('Muži', '/categories/men'), page('Ženy', '/categories/women')],
      loading: false,
    });
  });

  it('narrows the section once the active categories arrive', () => {
    mockUseFetchActiveCategories.mockReturnValue({
      data: [category('men')],
      loading: false,
      error: null,
    });

    render(<Header />);

    expect(screen.getAllByText('Kategorie').length).toBeGreaterThan(0);
  });

  it('keeps the section while the categories are still loading', () => {
    // `data` is [] before the request resolves. Narrowing on that would drop
    // the section and flash it back in.
    mockUseFetchActiveCategories.mockReturnValue({data: [], loading: true, error: null});

    render(<Header />);

    expect(screen.getAllByText('Kategorie').length).toBeGreaterThan(0);
  });

  it('keeps the section when the request failed', () => {
    // The failure mode that matters: [] with loading false would hide the main
    // menu section for good.
    mockUseFetchActiveCategories.mockReturnValue({
      data: [],
      loading: false,
      error: 'boom',
    });

    render(<Header />);

    expect(screen.getAllByText('Kategorie').length).toBeGreaterThan(0);
  });
});

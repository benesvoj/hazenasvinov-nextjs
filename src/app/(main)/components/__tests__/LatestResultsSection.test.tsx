import {render, screen} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const {mockUseAllCategoriesOwnClubMatches} = vi.hoisted(() => ({
  mockUseAllCategoriesOwnClubMatches: vi.fn(),
}));

vi.mock('@/hooks', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAllCategoriesOwnClubMatches: mockUseAllCategoriesOwnClubMatches,
}));

// The component pulls MatchResultCard from the folder barrel, so that is what
// has to be mocked — the barrel also drags in the rest of the home page.
vi.mock('@/app/(main)/components', () => ({
  MatchResultCard: ({match}: {match: {id: string}}) => <div>{`zapas-${match.id}`}</div>,
}));

import LatestResultsSection from '@/app/(main)/components/LatestResultsSection';

const match = (id: string) => ({id, category: {name: 'Muži'}});

// jsdom has no ResizeObserver and reports 0 for every layout box, so both have
// to be supplied. Everything patched here is restored in afterEach: these are
// properties on HTMLElement.prototype and on globalThis, and leaving them in
// place would follow the worker into other test files.
const patched: (() => void)[] = [];

const patchPrototype = (property: 'scrollWidth' | 'clientWidth', get: () => number) => {
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, property);
  Object.defineProperty(HTMLElement.prototype, property, {configurable: true, get});
  patched.push(() => {
    if (original) Object.defineProperty(HTMLElement.prototype, property, original);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[property];
  });
};

/** Simulates the results being `content` wide inside a `viewport` wide box. */
const setWidths = ({content, viewport}: {content: number; viewport: number}) => {
  patchPrototype('scrollWidth', function (this: HTMLElement) {
    return this.getAttribute('aria-hidden') === null && this.className.includes('flex gap-2')
      ? content
      : 0;
  });
  patchPrototype('clientWidth', () => viewport);
};

beforeEach(() => {
  const originalObserver = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  patched.push(() => {
    globalThis.ResizeObserver = originalObserver;
  });
});

afterEach(() => {
  while (patched.length) patched.pop()!();
});

describe('LatestResultsSection', () => {
  beforeEach(() => {
    mockUseAllCategoriesOwnClubMatches.mockReturnValue({
      matches: [match('a')],
      loading: false,
      error: null,
    });
  });

  it('shows a single played match once, not twice', () => {
    // The reported bug: early in a season one match was played and the card
    // appeared twice, because the marquee always rendered the set doubled.
    setWidths({content: 300, viewport: 1000});

    render(<LatestResultsSection />);

    expect(screen.getAllByText('zapas-a')).toHaveLength(1);
  });

  it('duplicates the set once the results are wide enough to scroll', () => {
    // The -50% translate needs the content doubled, or the loop jumps.
    setWidths({content: 2000, viewport: 400});

    render(<LatestResultsSection />);

    expect(screen.getAllByText('zapas-a')).toHaveLength(2);
  });

  it('renders nothing when there are no results', () => {
    mockUseAllCategoriesOwnClubMatches.mockReturnValue({
      matches: [],
      loading: false,
      error: null,
    });
    setWidths({content: 0, viewport: 1000});

    const {container} = render(<LatestResultsSection />);

    expect(container).toBeEmptyDOMElement();
  });
});

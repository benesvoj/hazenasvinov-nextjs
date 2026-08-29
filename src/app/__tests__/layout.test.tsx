import {describe, expect, it, vi} from 'vitest';

// next/font is a build-time transform; it is not a callable function under
// vitest, and the layout calls it at module scope.
vi.mock('next/font/google', () => ({
  Inter: () => ({className: 'inter'}),
}));

// The providers pull in the whole app; the assertion is about the <html> tag.
vi.mock('@/components/providers/ConditionalProviders', () => ({
  ConditionalProviders: ({children}: {children: React.ReactNode}) => children,
}));

import RootLayout from '@/app/layout';

describe('RootLayout', () => {
  it('declares the document language as Czech', () => {
    // Every user-facing string in this app is Czech. Declaring English made
    // Chrome translate the page for Czech users, and the translation engine
    // rewrites text nodes underneath React — which then fails a commit with
    // "Failed to execute 'insertBefore' on 'Node'" and drops the whole page
    // into the error boundary. Reported from the coach portal on 2026-08-29.
    const tree = RootLayout({children: null}) as React.ReactElement<{lang: string}>;

    expect(tree.props.lang).toBe('cs');
  });
});

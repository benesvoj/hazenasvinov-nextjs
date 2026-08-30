'use client';

// Imported by path, not through the barrel: the codegen that maintains
// src/components/index.ts is missing from the repo (see PR #79, whose merge
// is not in main's history), and the barrel must not be edited by hand.
import {ErrorBoundaryFallback} from '@/components/shared/errors/ErrorBoundaryFallback';

/**
 * Root error boundary — the last thing between a thrown render and a blank page.
 *
 * The segment boundaries in coaches/ and admin/ catch first and keep the
 * navigation around them; this one only runs for a throw outside those, and so
 * fills the viewport.
 *
 * Not to be confused with error/page.tsx, which is the page auth failures
 * redirect to. That used to live here, where it was never reachable.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & {digest?: string};
  reset: () => void;
}) {
  return <ErrorBoundaryFallback error={error} reset={reset} fullScreen />;
}

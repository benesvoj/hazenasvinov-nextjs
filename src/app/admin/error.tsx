'use client';

// Imported by path, not through the barrel: the codegen that maintains
// src/components/index.ts is missing from the repo (see PR #79, whose merge
// is not in main's history), and the barrel must not be edited by hand.
import {ErrorBoundaryFallback} from '@/components/shared/errors/ErrorBoundaryFallback';

/**
 * Keeps a throw inside the admin portal's content area. Without it the root
 * boundary takes over and the whole page goes, navigation included — so a crash
 * in one dialog costs the user everything else they had open.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & {digest?: string};
  reset: () => void;
}) {
  return <ErrorBoundaryFallback error={error} reset={reset} />;
}

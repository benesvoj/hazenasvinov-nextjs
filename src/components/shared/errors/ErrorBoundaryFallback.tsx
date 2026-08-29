'use client';

import {Button, Card, CardBody} from '@heroui/react';

import {ArrowPathIcon, ExclamationTriangleIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

interface ErrorBoundaryFallbackProps {
  /** The error Next.js caught. `digest` identifies it in the server logs. */
  error: Error & {digest?: string};
  /** Re-renders the segment. Worth offering: most of these are transient. */
  reset: () => void;
  /**
   * Fills the viewport rather than the segment. Used by the root boundary,
   * where there is no surrounding chrome left to sit inside.
   */
  fullScreen?: boolean;
}

/**
 * What a coach sees when a render throws.
 *
 * Deliberately plain, and deliberately offering `reset`: the errors this
 * catches are mostly transient — a failed chunk load, a DOM that some browser
 * extension or translation engine moved out from under React — and re-rendering
 * the segment usually clears them without losing the rest of the page.
 */
export const ErrorBoundaryFallback = ({
  error,
  reset,
  fullScreen = false,
}: ErrorBoundaryFallbackProps) => {
  const t = translations.errorBoundary;

  return (
    <div
      className={`flex items-center justify-center p-4 ${fullScreen ? 'min-h-screen' : 'min-h-[24rem]'}`}
    >
      <Card className="w-full max-w-md">
        <CardBody className="text-center py-10">
          <ExclamationTriangleIcon className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t.title}</h2>
          <p className="text-foreground-500 mb-6">{t.description}</p>

          <Button
            color="primary"
            onPress={reset}
            startContent={<ArrowPathIcon className="w-4 h-4" />}
            className="w-full"
          >
            {t.retry}
          </Button>

          {/*
            The digest is the only handle on the server-side log entry for this
            error, and a coach reporting a problem can read it out. Shown small
            and last so it does not look like something they must act on.
          */}
          {error.digest && (
            <p className="mt-4 text-xs text-foreground-400">{t.digest(error.digest)}</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

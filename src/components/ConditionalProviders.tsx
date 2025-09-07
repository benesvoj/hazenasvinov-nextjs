'use client';

import { usePathname } from 'next/navigation';
import { UserProvider } from '@/contexts/UserContext';
import { AppDataProvider } from '@/contexts/AppDataContext';
import { ThemeProviders } from '@/app/theme-providers';
import { ChunkErrorBoundary, DatabaseErrorBoundary } from '@/components';

// Pages that should NOT load UserContext and AppDataContext
const EXCLUDED_PAGES = [
  '/reset-password',
  '/set-password',
  '/login',
  '/',
  '/error',
  '/blocked'
];

// Pages that should NOT load AppDataContext (but can load UserContext)
const NO_APP_DATA_PAGES = [
  '/reset-password',
  '/set-password',
  '/login',
  '/',
  '/error',
  '/blocked'
];

interface ConditionalProvidersProps {
  children: React.ReactNode;
}

export function ConditionalProviders({ children }: ConditionalProvidersProps) {
  const pathname = usePathname();
  
  // Get the base path without query parameters
  const basePath = pathname.split('?')[0];
  
  const shouldLoadUserContext = !EXCLUDED_PAGES.includes(basePath);
  const shouldLoadAppDataContext = !NO_APP_DATA_PAGES.includes(basePath) && shouldLoadUserContext;

  // If this is a page that doesn't need any contexts, just render the children
  if (!shouldLoadUserContext) {
    return (
      <ThemeProviders>
        <ChunkErrorBoundary>
          <DatabaseErrorBoundary>
            {children}
          </DatabaseErrorBoundary>
        </ChunkErrorBoundary>
      </ThemeProviders>
    );
  }

  // If this page needs UserContext but not AppDataContext
  if (shouldLoadUserContext && !shouldLoadAppDataContext) {
    return (
      <UserProvider>
        <ThemeProviders>
          <ChunkErrorBoundary>
            <DatabaseErrorBoundary>
              {children}
            </DatabaseErrorBoundary>
          </ChunkErrorBoundary>
        </ThemeProviders>
      </UserProvider>
    );
  }

  // If this page needs both contexts
  return (
    <UserProvider>
      <AppDataProvider>
        <ThemeProviders>
          <ChunkErrorBoundary>
            <DatabaseErrorBoundary>
              {children}
            </DatabaseErrorBoundary>
          </ChunkErrorBoundary>
        </ThemeProviders>
      </AppDataProvider>
    </UserProvider>
  );
}

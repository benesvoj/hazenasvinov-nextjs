'use client';

import {usePathname} from 'next/navigation';
import {UserProvider} from '@/contexts/UserContext';
import {AppDataProvider} from '@/contexts/AppDataContext';
import {ThemeProviders} from '@/app/theme-providers';
import {ChunkErrorBoundary, DatabaseErrorBoundary} from '@/components';
import {QueryProvider} from '@/components/providers/QueryProvider';

// Pages that should NOT load UserContext and AppDataContext
const EXCLUDED_PAGES = ['/reset-password', '/set-password', '/login', '/', '/error', '/blocked'];

// Pages that should NOT load AppDataContext (but can load UserContext)
const NO_APP_DATA_PAGES = ['/reset-password', '/set-password', '/login', '/', '/error', '/blocked'];

// Public pages that don't need user context
const PUBLIC_PAGES = ['/categories', '/blog', '/matches', '/about', '/contact'];

interface ConditionalProvidersProps {
  children: React.ReactNode;
}

export function ConditionalProviders({children}: ConditionalProvidersProps) {
  const pathname = usePathname();

  // Get the base path without query parameters
  const basePath = pathname.split('?')[0];

  // Check if this is a public page (categories, blog, etc.)
  const isPublicPage = PUBLIC_PAGES.some((publicPath) => basePath.startsWith(publicPath));

  // Check if this is an admin page
  const isAdminPage = basePath.startsWith('/admin');

  const shouldLoadUserContext = !EXCLUDED_PAGES.includes(basePath) && !isPublicPage;
  const shouldLoadAppDataContext =
    !NO_APP_DATA_PAGES.includes(basePath) &&
    shouldLoadUserContext &&
    (!isPublicPage || isAdminPage);

  // If this is a page that doesn't need any contexts, just render the children
  if (!shouldLoadUserContext) {
    return (
      <QueryProvider>
        <ThemeProviders>
          <ChunkErrorBoundary>
            <DatabaseErrorBoundary>{children}</DatabaseErrorBoundary>
          </ChunkErrorBoundary>
        </ThemeProviders>
      </QueryProvider>
    );
  }

  // If this page needs UserContext but not AppDataContext
  if (shouldLoadUserContext && !shouldLoadAppDataContext) {
    return (
      <QueryProvider>
        <UserProvider>
          <ThemeProviders>
            <ChunkErrorBoundary>
              <DatabaseErrorBoundary>{children}</DatabaseErrorBoundary>
            </ChunkErrorBoundary>
          </ThemeProviders>
        </UserProvider>
      </QueryProvider>
    );
  }

  // If this page needs both contexts
  return (
    <QueryProvider>
      <UserProvider>
        <AppDataProvider>
          <ThemeProviders>
            <ChunkErrorBoundary>
              <DatabaseErrorBoundary>{children}</DatabaseErrorBoundary>
            </ChunkErrorBoundary>
          </ThemeProviders>
        </AppDataProvider>
      </UserProvider>
    </QueryProvider>
  );
}

import {ReactNode} from 'react';

import {PortalVariant} from '@/lib/portal';

interface BaseLayoutProps {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
  isCollapsed: boolean;
  isMobile: boolean;
  variant: PortalVariant;
}

export const BaseLayout = ({
  sidebar,
  topbar,
  children,
  isCollapsed,
  isMobile,
  variant,
}: BaseLayoutProps) => {
  return (
    <div
      data-layout="portal"
      data-variant={variant}
      className="flex min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      {sidebar}

      <div
        className={`flex-1 transition-all duration-300 ease-in-out w-full ${
          isMobile ? 'ml-0' : isCollapsed ? 'lg:ml-16' : 'lg:ml-56'
        }`}
      >
        {topbar}

        <main className="pt-24 px-3 sm:px-4 lg:px-6 pb-6">
          <div className="w-full pr-24">{children}</div>
        </main>
      </div>
    </div>
  );
};

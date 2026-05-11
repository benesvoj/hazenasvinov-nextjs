import {ReactNode} from 'react';

import {PortalVariant} from '@/lib/portal';

import {BaseLayout} from '@/shared/components';

interface PortalLayoutProps {
  variant: PortalVariant;
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
  useSidebar: () => {isCollapsed: boolean; isMobile: boolean};
}

export function PortalLayout({variant, sidebar, topbar, children, useSidebar}: PortalLayoutProps) {
  const {isCollapsed, isMobile} = useSidebar();

  return (
    <BaseLayout
      sidebar={sidebar}
      topbar={topbar}
      isCollapsed={isCollapsed}
      isMobile={isMobile}
      variant={variant}
    >
      {children}
    </BaseLayout>
  );
}

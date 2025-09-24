'use client';

import React from 'react';
import {usePathname} from 'next/navigation';
import routes from '@/routes/routes';
import {useAdminSidebar} from './AdminSidebarContext';
import {UnifiedTopBar} from '@/components';
import {UserRoles} from '@/enums';

// Get current section info based on pathname
const getCurrentSection = (pathname: string) => {
  const currentRoute = routes.find((route) => route.route === pathname);

  if (currentRoute) {
    return {
      title: currentRoute.title,
      description: currentRoute.description || '',
    };
  }

  // Fallback for dynamic routes
  if (pathname.includes('/admin/teams')) {
    return {title: 'Týmy', description: 'Správa týmů a jejich informací.'};
  }
  if (pathname.includes('/admin/matches')) {
    return {
      title: 'Zápasy',
      description: 'Správa zápasů, výsledků a tabulek pro všechny kategorie.',
    };
  }
  if (pathname.includes('/admin/members')) {
    return {
      title: 'Členové',
      description: 'Správa členů klubu - přidávání, úprava a mazání členů.',
    };
  }
  if (pathname.includes('/admin/seasons')) {
    return {title: 'Sezóny', description: 'Správa sezón pro organizaci soutěží a týmů.'};
  }
  if (pathname.includes('/admin/categories')) {
    return {title: 'Kategorie', description: 'Správa kategorií pro týmové soutěže a členy klubu.'};
  }
  if (pathname.includes('/admin/users')) {
    return {
      title: 'Uživatelé',
      description: 'Správa uživatelů, kteří se mohou přihlásit do systému.',
    };
  }

  return {title: 'Dashboard', description: 'Správa obsahu a nastavení systému.'};
};

export const AdminTopBar = () => {
  const pathname = usePathname();
  const {isCollapsed, isMobileOpen, setIsMobileOpen, isMobile} = useAdminSidebar();
  const currentSection = getCurrentSection(pathname);

  return (
    <UnifiedTopBar
      variant={UserRoles.ADMIN}
      sidebarContext={{
        isCollapsed,
        isMobileOpen,
        setIsMobileOpen,
        isMobile,
      }}
      pageTitle={currentSection.title}
      pageDescription={currentSection.description}
    />
  );
};

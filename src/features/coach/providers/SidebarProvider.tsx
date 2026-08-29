'use client';

import React, {createContext, useContext, useState, useEffect} from 'react';

interface CoachSidebarContextType {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarProvider = createContext<CoachSidebarContextType | undefined>(undefined);

export function CoachSidebarProvider({children}: {children: React.ReactNode}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isNowMobile = window.innerWidth < 1024;
      setIsMobile(isNowMobile);

      if (!isNowMobile) {
        setIsMobileOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('coaches-sidebar-collapsed');
    if (saved !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('coaches-sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const setCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
  };

  return (
    <SidebarProvider.Provider
      value={{
        isCollapsed,
        isMobileOpen,
        setIsMobileOpen,
        isMobile,
        toggleSidebar,
        setCollapsed,
      }}
    >
      {children}
    </SidebarProvider.Provider>
  );
}

export function useCoachesSidebar() {
  const context = useContext(SidebarProvider);
  if (context === undefined) {
    throw new Error('useCoachesSidebar must be used within a CoachesSidebarProvider');
  }
  return context;
}

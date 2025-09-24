'use client';

import React, {createContext, useContext, useState, useEffect} from 'react';

interface UnifiedSidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}

const UnifiedSidebarContext = createContext<UnifiedSidebarContextType | undefined>(undefined);

export const useUnifiedSidebar = () => {
  const context = useContext(UnifiedSidebarContext);
  if (context === undefined) {
    throw new Error('useUnifiedSidebar must be used within a UnifiedSidebarProvider');
  }
  return context;
};

interface UnifiedSidebarProviderProps {
  children: React.ReactNode;
  variant: 'admin' | 'coach';
}

export const UnifiedSidebarProvider: React.FC<UnifiedSidebarProviderProps> = ({
  children,
  variant,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Load sidebar state from localStorage on mount (coach variant only)
  useEffect(() => {
    if (variant === 'coach') {
      const saved = localStorage.getItem('coaches-sidebar-collapsed');
      if (saved !== null) {
        setIsCollapsed(JSON.parse(saved));
      }
    }
  }, [variant]);

  // Save sidebar state to localStorage when it changes (coach variant only)
  useEffect(() => {
    if (variant === 'coach') {
      localStorage.setItem('coaches-sidebar-collapsed', JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, variant]);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <UnifiedSidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        isMobileOpen,
        setIsMobileOpen,
        isMobile,
        toggleSidebar,
      }}
    >
      {children}
    </UnifiedSidebarContext.Provider>
  );
};

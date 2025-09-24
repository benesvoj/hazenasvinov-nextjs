'use client';

import React, {createContext, useContext, useState, useEffect} from 'react';

interface AdminSidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isMobile: boolean;
}

const AdminSidebarContext = createContext<AdminSidebarContextType | undefined>(undefined);

export const useAdminSidebar = () => {
  const context = useContext(AdminSidebarContext);
  if (context === undefined) {
    throw new Error('useAdminSidebar must be used within a AdminSidebarProvider');
  }
  return context;
};

export const AdminSidebarProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  return (
    <AdminSidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        isMobileOpen,
        setIsMobileOpen,
        isMobile,
      }}
    >
      {children}
    </AdminSidebarContext.Provider>
  );
};

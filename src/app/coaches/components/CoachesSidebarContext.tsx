'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface CoachesSidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const CoachesSidebarContext = createContext<CoachesSidebarContextType | undefined>(undefined);

export function CoachesSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('coaches-sidebar-collapsed');
    if (saved !== null) {
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
    <CoachesSidebarContext.Provider value={{ isCollapsed, toggleSidebar, setCollapsed }}>
      {children}
    </CoachesSidebarContext.Provider>
  );
}

export function useCoachesSidebar() {
  const context = useContext(CoachesSidebarContext);
  if (context === undefined) {
    throw new Error('useCoachesSidebar must be used within a CoachesSidebarProvider');
  }
  return context;
}

'use client';

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCoachesSidebar } from "./CoachesSidebarContext";
import { useAuth } from "@/hooks/useAuth";
import { UnifiedTopBar } from "@/components";

const getPageTitle = (pathname: string) => {
  switch (pathname) {
    case '/coaches/dashboard':
      return 'Dashboard';
    case '/coaches/teams':
      return 'Moje týmy';
    case '/coaches/videos':
      return 'Videa';
    case '/coaches/statistics':
      return 'Statistiky';
    case '/coaches/meeting-minutes':
      return 'Zápisy ze schůzí';
    default:
      return 'Trenérský Portal';
  }
};

export const CoachesTopBar = () => {
  const pathname = usePathname();
  const { toggleSidebar } = useCoachesSidebar();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('role, clubs(name)')
          .eq('user_id', user.id);
          
        // Find coach profile or use first profile
        const profile = profiles?.find((p: any) => p.role === 'coach' || p.role === 'head_coach') || profiles?.[0];
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  return (
    <UnifiedTopBar
      variant="coach"
      sidebarContext={{
        toggleSidebar
      }}
      pageTitle={getPageTitle(pathname)}
      userProfile={userProfile}
    />
  );
};

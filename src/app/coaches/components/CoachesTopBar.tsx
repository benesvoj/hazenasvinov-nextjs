'use client';

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCoachesSidebar } from "./CoachesSidebarContext";
import { useAuth } from "@/hooks/useAuth";
import { 
  UserIcon,
  Bars3Icon,
  ArrowRightEndOnRectangleIcon
} from "@heroicons/react/24/outline";
import { 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem,
  Button,
  Avatar
} from "@heroui/react";

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
    default:
      return 'Trenérský Portal';
  }
};

export function CoachesTopBar() {
  const pathname = usePathname();
  const { toggleSidebar } = useCoachesSidebar();
  const { user, signOut } = useAuth();
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

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/coaches/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 bg-white shadow-sm border-b border-gray-200 z-30 transition-all duration-300">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Mobile menu button and page title */}
        <div className="flex items-center space-x-4">
          <Button
            isIconOnly
            variant="light"
            className="lg:hidden"
            onPress={toggleSidebar}
          >
            <Bars3Icon className="w-5 h-5" />
          </Button>
          
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {getPageTitle(pathname)}
            </h1>
            <p className="text-sm text-gray-600">
              {userProfile?.role === 'head_coach' ? 'Hlavní trenér' : 'Trenér'} • {userProfile?.clubs?.name || 'TJ Sokol Svinov'}
            </p>
          </div>
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center space-x-4">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                variant="light"
                className="flex items-center space-x-2 p-2"
              >
                <Avatar
                  size="sm"
                  name={user?.email?.charAt(0).toUpperCase()}
                  className="bg-green-100 text-green-700"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {userProfile?.role === 'head_coach' ? 'Hlavní trenér' : 'Trenér'}
                  </p>
                </div>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu">
              <DropdownItem
                key="profile"
                startContent={<UserIcon className="w-4 h-4" />}
              >
                Profil
              </DropdownItem>
              <DropdownItem
                key="logout"
                className="text-danger"
                color="danger"
                startContent={<ArrowRightEndOnRectangleIcon className="w-4 h-4" />}
                onPress={handleSignOut}
              >
                Odhlásit se
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}

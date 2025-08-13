'use client';

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import routes, { privateRoutes } from "@/routes/routes";
import { useSidebar } from "./SidebarContext";
import { useAuth } from "@/hooks/useAuth";
import { logSuccessfulLogin, logFailedLogin, logLogout } from "@/utils/loginLogger";
import { 
  UserIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem,
  Button,
  Badge,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Avatar,
  Input,
  Textarea,
  Divider
} from "@heroui/react";
import { ReleaseNote, getReleaseNotes } from "@/utils/releaseNotes";
import { createClient } from "@/utils/supabase/client";

// Get current section info based on pathname
const getCurrentSection = (pathname: string) => {
  const currentRoute = routes.find(route => route.route === pathname);
  
  if (currentRoute) {
    return {
      title: currentRoute.title,
      description: currentRoute.description || ''
    };
  }
  
  // Fallback for dynamic routes
  if (pathname.includes('/admin/teams')) {
    return { title: 'Týmy', description: 'Správa týmů a jejich informací.' };
  }
  if (pathname.includes('/admin/matches')) {
    return { title: 'Zápasy', description: 'Správa zápasů, výsledků a tabulek pro všechny kategorie.' };
  }
  if (pathname.includes('/admin/members')) {
    return { title: 'Členové', description: 'Správa členů klubu - přidávání, úprava a mazání členů.' };
  }
  if (pathname.includes('/admin/seasons')) {
    return { title: 'Sezóny', description: 'Správa sezón pro organizaci soutěží a týmů.' };
  }
  if (pathname.includes('/admin/categories')) {
    return { title: 'Kategorie', description: 'Správa kategorií pro týmové soutěže a členy klubu.' };
  }
  if (pathname.includes('/admin/users')) {
    return { title: 'Uživatelé', description: 'Správa uživatelů, kteří se mohou přihlásit do systému.' };
  }
  
  return { title: 'Dashboard', description: 'Správa obsahu a nastavení systému.' };
};

export const TopBar = () => {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState(3); // Mock notification count
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    position: ''
  });

  const currentSection = getCurrentSection(pathname);

  useEffect(() => {
    loadReleaseNotes();
  }, []);

  useEffect(() => {
    if (user && showProfileDialog) {
      setProfileData({
        fullName: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        bio: user.user_metadata?.bio || '',
        position: user.user_metadata?.position || ''
      });
    }
  }, [user, showProfileDialog]);

  const loadReleaseNotes = () => {
    try {
      const notes = getReleaseNotes();
      setReleaseNotes(notes);
    } catch (error) {
      console.error('Error loading release notes:', error);
      setReleaseNotes([]);
    }
  };

  const handleLogout = async () => {
    try {
      // Log the logout if we have user information
      if (user?.email) {
        try {
          await logLogout(user.email);
        } catch (logError) {
          console.error('Failed to log logout:', logError);
          // Don't block logout if logging fails
        }
      }
      
      await signOut();
      // Redirect will be handled by the auth hook
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleReleaseNotes = () => {
    setShowReleaseNotes(!showReleaseNotes);
  };

  const handleProfileEdit = () => {
    setIsEditing(true);
  };

  const handleProfileSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const supabase = createClient();
      
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.fullName,
          phone: profileData.phone,
          bio: profileData.bio,
          position: profileData.position
        }
      });

      if (error) {
        console.error('Error updating profile:', error);
        // You could add a toast notification here
      } else {
        setIsEditing(false);
        // Refresh user data or show success message
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileCancel = () => {
    setIsEditing(false);
    // Reset to original values
    if (user) {
      setProfileData({
        fullName: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        bio: user.user_metadata?.bio || '',
        position: user.user_metadata?.position || ''
      });
    }
  };

  const handleProfileOpen = () => {
    setShowProfileDialog(true);
    setIsEditing(false);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    
    // Try to get name from user metadata first
    if (user.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    
    // Fallback to email initials
    const emailParts = user.email.split('@')[0];
    if (emailParts.includes('.')) {
      const parts = emailParts.split('.');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
    }
    return emailParts[0].toUpperCase();
  };

  // Get display name
  const getDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Uživatel';
  };

  return (
    <div className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-200 shadow-sm z-40 transition-all duration-300 ease-in-out ${
      isCollapsed ? 'left-16' : 'left-64'
    }`}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side - Section info */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{currentSection.title}</h1>
            {currentSection.description && (
              <p className="text-sm text-gray-600 mt-1">{currentSection.description}</p>
            )}
          </div>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center space-x-4">
          {/* Release Notes Button */}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className="relative"
            onPress={handleReleaseNotes}
            title="Release Notes"
          >
            <DocumentTextIcon className="w-5 h-5 text-gray-600" />
            {releaseNotes.length > 0 && (
              <Badge 
                color="primary" 
                size="sm"
                className="absolute -top-1 -right-1"
              >
                {releaseNotes.length}
              </Badge>
            )}
          </Button>

          {/* Notifications */}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className="relative"
            title="Notifikace"
          >
            <BellIcon className="w-5 h-5 text-gray-600" />
            {notifications > 0 && (
              <Badge 
                color="danger" 
                size="sm"
                className="absolute -top-1 -right-1"
              >
                {notifications}
              </Badge>
            )}
          </Button>

          {/* Settings */}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            title="Nastavení"
          >
            <Cog6ToothIcon className="w-5 h-5 text-gray-600" />
          </Button>

          {/* User Profile Dropdown */}
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                variant="light"
                className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 transition-colors duration-200"
              >
                <Avatar
                  name={getUserInitials()}
                  className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-medium"
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
                  <p className="text-xs text-gray-500">{user?.email || 'Načítání...'}</p>
                </div>
                <div className="hidden lg:block">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User actions">
              <DropdownItem key="profile-header" className="py-3" onPress={handleProfileOpen}>
                <div className="flex items-center space-x-3">
                  <Avatar
                    name={getUserInitials()}
                    className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-base font-medium"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{getDisplayName()}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
              </DropdownItem>
              <DropdownItem key="divider-1" className="h-px bg-gray-200 my-2" isReadOnly>
                <div className="h-px bg-gray-200"></div>
              </DropdownItem>
              <DropdownItem key="profile-action" startContent={<UserIcon className="w-4 h-4" />} onPress={handleProfileOpen}>
                <span>Profil</span>
              </DropdownItem>
              <DropdownItem key="settings" startContent={<Cog6ToothIcon className="w-4 h-4" />}>
                <span>Nastavení</span>
              </DropdownItem>
              <DropdownItem key="logout" color="danger" startContent={<ArrowRightOnRectangleIcon className="w-4 h-4" />} onPress={handleLogout}>
                <span>Odhlásit</span>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Profile Dialog */}
      <Modal 
        isOpen={showProfileDialog} 
        onClose={() => setShowProfileDialog(false)} 
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <Avatar
                name={getUserInitials()}
                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg font-medium"
              />
              <div>
                <h2 className="text-xl font-semibold">Profil uživatele</h2>
                <p className="text-sm text-gray-500">Upravte své osobní informace</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Celé jméno</label>
                {isEditing ? (
                  <Input
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                    placeholder="Zadejte své celé jméno"
                    size="sm"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-gray-900">{profileData.fullName || 'Není vyplněno'}</p>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-gray-900">{profileData.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Email nelze změnit</p>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Telefon</label>
                {isEditing ? (
                  <Input
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    placeholder="+420 123 456 789"
                    size="sm"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-gray-900">{profileData.phone || 'Není vyplněno'}</p>
                  </div>
                )}
              </div>

              {/* Position */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Pozice</label>
                {isEditing ? (
                  <Input
                    value={profileData.position}
                    onChange={(e) => setProfileData({...profileData, position: e.target.value})}
                    placeholder="Např. Administrátor, Editor"
                    size="sm"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-gray-900">{profileData.position || 'Není vyplněno'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">O mně</label>
              {isEditing ? (
                <Textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  placeholder="Krátce se představte..."
                  size="sm"
                  minRows={3}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-gray-900">{profileData.bio || 'Není vyplněno'}</p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter className="flex justify-between">
            <div className="flex gap-2">
              {!isEditing ? (
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<PencilIcon className="w-4 h-4" />}
                  onPress={handleProfileEdit}
                >
                  Upravit profil
                </Button>
              ) : (
                <>
                  <Button
                    color="success"
                    variant="flat"
                    startContent={<CheckIcon className="w-4 h-4" />}
                    onPress={handleProfileSave}
                    isLoading={isSaving}
                  >
                    Uložit změny
                  </Button>
                  <Button
                    color="default"
                    variant="flat"
                    startContent={<XMarkIcon className="w-4 h-4" />}
                    onPress={handleProfileCancel}
                  >
                    Zrušit
                  </Button>
                </>
              )}
            </div>
            <Button
              color="default"
              variant="light"
              onPress={() => setShowProfileDialog(false)}
            >
              Zavřít
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Release Notes Modal */}
      <Modal 
        isOpen={showReleaseNotes} 
        onClose={() => setShowReleaseNotes(false)} 
        size="4xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-h-[90vh] overflow-hidden",
          wrapper: "items-center justify-center p-4",
          body: "max-h-[70vh] overflow-y-auto"
        }}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-blue-500" />
              <span>Release Notes</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {releaseNotes.map((release, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Version {release.version}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {release.date}
                      </p>
                    </div>
                    {index === 0 && (
                      <Chip color="success" variant="shadow">
                        Current
                      </Chip>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {release.features.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          🚀 New Features
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {release.features.map((feature, idx) => (
                            <li key={idx}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {release.improvements.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          🔧 Improvements
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {release.improvements.map((improvement, idx) => (
                            <li key={idx}>{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {release.bugFixes.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          🐛 Bug Fixes
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {release.bugFixes.map((bugFix, idx) => (
                            <li key={idx}>{bugFix}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {release.technicalUpdates.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          📋 Technical Updates
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {release.technicalUpdates.map((update, idx) => (
                            <li key={idx}>{update}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

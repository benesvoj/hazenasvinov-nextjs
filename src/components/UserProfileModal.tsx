'use client';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Avatar, Input, Textarea, ModalProps } from "@heroui/react";
import { CheckIcon, XMarkIcon, PencilIcon } from "@heroicons/react/24/outline";
import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface UserProfileModalProps extends Omit<ModalProps, 'isOpen' | 'onOpenChange' | 'children'> {
    showProfileDialog: boolean;
    setShowProfileDialog: (show: boolean) => void;
    user: User | null;
}

export const UserProfileModal = ({ showProfileDialog, setShowProfileDialog, user }: UserProfileModalProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [profileData, setProfileData] = useState({
        fullName: '',
        email: '',
        phone: '',
        bio: '',
        position: ''
    });

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

    return (
        <Modal 
        isOpen={showProfileDialog} 
        onClose={() => setShowProfileDialog(false)} 
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          wrapper: "items-center justify-center p-2 sm:p-4"
        }}
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Upravte své osobní informace</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Celé jméno</label>
                {isEditing ? (
                  <Input
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                    placeholder="Zadejte své celé jméno"
                    size="sm"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-gray-900 dark:text-white">{profileData.fullName || 'Není vyplněno'}</p>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-900 dark:text-white">{profileData.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email nelze změnit</p>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Telefon</label>
                {isEditing ? (
                  <Input
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    placeholder="+420 123 456 789"
                    size="sm"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-gray-900 dark:text-white">{profileData.phone || 'Není vyplněno'}</p>
                  </div>
                )}
              </div>

              {/* Position */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pozice</label>
                {isEditing ? (
                  <Input
                    value={profileData.position}
                    onChange={(e) => setProfileData({...profileData, position: e.target.value})}
                    placeholder="Např. Administrátor, Editor"
                    size="sm"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-gray-900 dark:text-white">{profileData.position || 'Není vyplněno'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">O mně</label>
              {isEditing ? (
                <Textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  placeholder="Krátce se představte..."
                  size="sm"
                  minRows={3}
                />
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-900 dark:text-white">{profileData.bio || 'Není vyplněno'}</p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
            <div className="flex gap-2 w-full sm:w-auto">
              {!isEditing ? (
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<PencilIcon className="w-4 h-4" />}
                  onPress={handleProfileEdit}
                  className="flex-1 sm:flex-none"
                  aria-label="Upravit profil"
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
                    className="flex-1 sm:flex-none"
                    aria-label="Uložit změny profilu"
                  >
                    Uložit změny
                  </Button>
                  <Button
                    color="default"
                    variant="flat"
                    startContent={<XMarkIcon className="w-4 h-4" />}
                    onPress={handleProfileCancel}
                    className="flex-1 sm:flex-none"
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
              className="w-full sm:w-auto"
            >
              Zavřít
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    )
}
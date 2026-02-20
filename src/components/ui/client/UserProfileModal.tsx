'use client';

import {useState} from 'react';

import {Input, ModalProps, Textarea} from '@heroui/react';

import {User} from '@supabase/supabase-js';

import {translations} from '@/lib/translations/index';

import {showToast, UnifiedModal} from '@/components';
import {useSupabaseClient} from '@/hooks';

interface UserProfileModalProps extends Omit<ModalProps, 'isOpen' | 'onOpenChange' | 'children'> {
  showProfileDialog: boolean;
  setShowProfileDialog: (show: boolean) => void;
  user: User | null;
}

interface ProfileFormModalProps {
  user: User;
  onClose: () => void;
}

/**
 * Inner component that contains both the modal and form.
 * By conditionally rendering this component only when the dialog is shown,
 * we ensure useState initializes with fresh data from props each time.
 * This eliminates the need for useEffect to sync props to state.
 */
const ProfileFormModal = ({user, onClose}: ProfileFormModalProps) => {
  // State initializes from props - no useEffect needed because
  // this component only mounts when modal opens
  const [profileData, setProfileData] = useState({
    fullName: user.user_metadata?.full_name || '',
    email: user.email || '',
    phone: user.user_metadata?.phone || '',
    bio: user.user_metadata?.bio || '',
    position: user.user_metadata?.position || '',
  });
  const supabase = useSupabaseClient();

  const handleProfileSave = async () => {
    try {
      const {error} = await supabase.auth.updateUser({
        data: {
          full_name: profileData.fullName,
          phone: profileData.phone,
          bio: profileData.bio,
          position: profileData.position,
        },
      });

      if (error) {
        console.error(translations.admin.profile.error.profileUpdateFailed, error);
      } else {
        showToast.success(translations.admin.profile.success.profileUpdated);
        onClose();
      }
    } catch (error) {
      console.error(translations.admin.profile.error.profileSaveFailed, error);
    }
  };

  return (
    <UnifiedModal
      isOpen={true}
      onClose={onClose}
      title={translations.admin.profile.modal.title}
      subtitle={translations.admin.profile.modal.subtitle}
      size="2xl"
      isFooterWithActions
      onPress={handleProfileSave}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Input
          value={profileData.fullName}
          onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
          label={translations.admin.profile.labels.fullName}
          placeholder={translations.admin.profile.labels.fullNamePlaceholder}
          size="sm"
        />
        <Input
          value={profileData.email}
          isDisabled
          label={translations.admin.profile.labels.email}
          size={'sm'}
          description={translations.admin.profile.labels.emailDescription}
        />
        <Input
          value={profileData.phone}
          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
          label={translations.admin.profile.labels.phone}
          placeholder={translations.admin.profile.labels.phonePlaceholder}
          size="sm"
        />
        <Input
          value={profileData.position}
          onChange={(e) => setProfileData({...profileData, position: e.target.value})}
          label={translations.admin.profile.labels.position}
          placeholder={translations.admin.profile.labels.positionPlaceholder}
          size="sm"
        />
      </div>
      <div className="space-y-2">
        <Textarea
          label={translations.admin.profile.labels.bio}
          value={profileData.bio}
          onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
          placeholder={translations.admin.profile.labels.bioPlaceholder}
          size="sm"
          minRows={3}
        />
      </div>
    </UnifiedModal>
  );
};

/**
 * User profile modal that conditionally renders the form.
 * When showProfileDialog becomes true, ProfileFormModal mounts fresh,
 * initializing state from the current user props without needing useEffect.
 */
export const UserProfileModal = ({
  showProfileDialog,
  setShowProfileDialog,
  user,
}: UserProfileModalProps) => {
  // Only render when dialog should be shown AND we have a user
  // This ensures ProfileFormModal mounts fresh each time with current user data
  if (!showProfileDialog || !user) {
    return null;
  }

  return (
    <ProfileFormModal
      key={user.id} // Reset form if user changes while modal is open
      user={user}
      onClose={() => setShowProfileDialog(false)}
    />
  );
};

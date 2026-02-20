'use client';

import React, {useState} from 'react';

import {
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectedItems,
  SelectItem,
} from '@heroui/react';

import {AcademicCapIcon} from '@heroicons/react/24/outline';

import {useAdminCategorySimulation} from '@/contexts/AdminCategorySimulationContext';

import {useSupabaseClient} from '@/hooks';
import {Category} from '@/types';

import LoadingSpinner from '../../ui/feedback/LoadingSpinner';

interface CoachPortalCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CoachPortalCategoryDialog({
  isOpen,
  onClose,
  onConfirm,
}: CoachPortalCategoryDialogProps) {
  const {selectedCategories, availableCategories, selectCategory, deselectCategory, loading} =
    useAdminCategorySimulation();
  const supabase = useSupabaseClient();

  const [tempSelectedCategories, setTempSelectedCategories] = useState<string[]>([]);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Initialize temp selection when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setTempSelectedCategories([...selectedCategories]);
      setProfileError(null);
    }
  }, [isOpen, selectedCategories]);

  // Function to ensure user has a profile and admin role
  const ensureUserProfile = async () => {
    try {
      // Get current user
      const {
        data: {user},
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if profile exists using user_id field
      const {data: profile, error: profileError} = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // Create profile if it doesn't exist
      if (profileError && profileError.code === 'PGRST116') {
        const {error: insertError} = await supabase.from('profiles').insert({
          user_id: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.full_name || user.email || 'Admin User',
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (insertError) {
          throw new Error(`Failed to create profile: ${insertError.message}`);
        }
      }

      // Check if admin role exists in user_roles
      const {data: userRole, error: roleError} = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      // Create admin role if it doesn't exist
      if (roleError && roleError.code === 'PGRST116') {
        const {error: insertRoleError} = await supabase.from('user_roles').insert({
          user_id: user.id,
          role: 'admin',
          created_at: new Date().toISOString(),
        });

        if (insertRoleError) {
          throw new Error(`Failed to create admin role: ${insertRoleError.message}`);
        }
      }

      return true;
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      throw error;
    }
  };

  const handleConfirm = async () => {
    setIsCreatingProfile(true);
    setProfileError(null);

    try {
      // Ensure user has profile and admin role
      await ensureUserProfile();

      // Update the actual selection
      selectedCategories.forEach((catId) => {
        if (!tempSelectedCategories.includes(catId)) {
          deselectCategory(catId);
        }
      });
      tempSelectedCategories.forEach((catId) => {
        if (!selectedCategories.includes(catId)) {
          selectCategory(catId);
        }
      });

      onConfirm();
    } catch (error) {
      console.error('Error setting up user profile:', error);
      setProfileError(error instanceof Error ? error.message : 'Failed to set up user profile');
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const handleClearAll = () => {
    setTempSelectedCategories([]);
  };

  const handleSelectAll = () => {
    setTempSelectedCategories(availableCategories.map((cat) => cat.id));
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center space-x-2">
              <AcademicCapIcon className="h-5 w-5 text-blue-600" />
              <span>Test Coach Portal</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center space-x-2">
            <AcademicCapIcon className="h-5 w-5 text-blue-600" />
            <span>Test Coach Portal</span>
          </div>
          <p className="text-sm text-gray-600 font-normal">
            Select categories to simulate coach access. You&apos;ll see filtered content in the
            coach portal.
          </p>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {/* Profile setup status */}
            {isCreatingProfile && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <LoadingSpinner />
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  Setting up your profile for coach portal access...
                </span>
              </div>
            )}

            {/* Profile error */}
            {profileError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">Error: {profileError}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="bordered"
                  onPress={handleSelectAll}
                  className="text-xs"
                  isDisabled={isCreatingProfile}
                >
                  Select All
                </Button>
                <Button
                  size="sm"
                  variant="bordered"
                  color="danger"
                  onPress={handleClearAll}
                  className="text-xs"
                  isDisabled={isCreatingProfile}
                >
                  Clear All
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                {tempSelectedCategories.length} of {availableCategories.length} selected
              </div>
            </div>

            <Select
              placeholder="Vyberte kategorii"
              selectedKeys={tempSelectedCategories}
              isMultiline={true}
              selectionMode="multiple"
              items={availableCategories}
              variant="bordered"
              aria-label="Výběr kategorii"
              onSelectionChange={(items) => {
                setTempSelectedCategories(Array.from(items as Set<string>));
              }}
              renderValue={(items: SelectedItems<Category>) => {
                return (
                  <div className="flex flex-wrap gap-2 py-2">
                    {items.map((item) => (
                      <Chip key={item.key}>{item.data?.name}</Chip>
                    ))}
                  </div>
                );
              }}
            >
              {(category) => (
                <SelectItem key={category.id} aria-label={category.name}>
                  {category.name}
                </SelectItem>
              )}
            </Select>

            {/* Info text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <strong>How it works:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Select the categories you want to test</li>
                  <li>Click &quot;Switch to Coach Portal&quot; to proceed</li>
                  <li>
                    You&apos;ll see filtered content as if you were a coach with those categories
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={isCreatingProfile}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleConfirm}
            startContent={
              isCreatingProfile ? <LoadingSpinner /> : <AcademicCapIcon className="h-4 w-4" />
            }
            isLoading={isCreatingProfile}
            isDisabled={tempSelectedCategories.length === 0 || isCreatingProfile}
          >
            {isCreatingProfile ? 'Setting up profile...' : 'Switch to Coach Portal'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

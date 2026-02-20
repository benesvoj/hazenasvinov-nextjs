'use client';

import React, {useState} from 'react';

import {Alert, RadioGroup, Skeleton} from '@heroui/react';

import {useModal} from '@/hooks/shared/useModals';

import {CustomRadio} from '@/components/ui/radio/CustomRadio';

import {translations} from '@/lib/translations/index';

import {CategorySelectionModal} from '@/app/admin/users/components/CategorySelectionModal';

import {showToast, UnifiedModal} from '@/components';
import {useUserRoles} from '@/hooks';
import {RoleDefinitionSchema} from '@/types';

interface RoleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onRoleAssigned: () => void;
}

export default function RoleAssignmentModal({
  isOpen,
  onClose,
  userId,
  userEmail,
  onRoleAssigned,
}: RoleAssignmentModalProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [pendingRole, setPendingRole] = useState<RoleDefinitionSchema | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Category selection state
  const categoryModal = useModal();

  const {
    roleDefinitions,
    rolesLoading,
    upsertUserProfile,
    loading,
    checkRoleRequiresCategories,
    getRoleById,
  } = useUserRoles();

  const handleAssignRole = async () => {
    if (!selectedRoleId) {
      setError(translations.admin.userRoles.errors.roleNotFound);
      return;
    }

    const selectedRole = getRoleById(selectedRoleId);
    if (!selectedRole) {
      setError(translations.admin.userRoles.errors.roleNotFound);
      return;
    }

    // If role requires category, show category selection modal
    if (checkRoleRequiresCategories(selectedRoleId)) {
      setPendingRole(selectedRole);
      categoryModal.onOpen();
      return;
    }
    // For roles that don't require category, assign directly
    await assignRole(selectedRole, null);
  };

  const assignRole = async (role: RoleDefinitionSchema, categories: string[] | null) => {
    setError(null);

    const result = await upsertUserProfile({
      userId,
      roleId: role.id,
      roleName: role.name,
      assignedCategories: categories,
    });

    if (result.success) {
      showToast.success(translations.admin.userRoles.success.roleAssigned);
      onRoleAssigned();
      onClose();
      setSelectedRoleId('');
    } else {
      setError(result.error || translations.admin.userRoles.errors.assignmentFailed);
    }
  };

  const handleCategoryConfirm = async (categories: string[]) => {
    if (!pendingRole) return;
    await assignRole(pendingRole, categories);
    categoryModal.onClose();
    setPendingRole(null);
  };

  const handleClose = () => {
    setSelectedRoleId('');
    setError(null);
    onClose();
  };

  return (
    <>
      <UnifiedModal
        isFooterWithActions
        isOpen={isOpen}
        onClose={handleClose}
        onPress={handleAssignRole}
        isDisabled={!selectedRoleId || loading}
        title={translations.admin.userRoles.title.assignRole}
        size="2xl"
        placement="center"
        backdrop="blur"
      >
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            {translations.common.labels.user}: <span className="font-medium">{userEmail}</span>
          </p>
        </div>

        {rolesLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        ) : (
          <RadioGroup value={selectedRoleId} onValueChange={setSelectedRoleId} className="gap-3">
            <div className={'grid grid-cols-2'}>
              {roleDefinitions.map((role) => (
                <CustomRadio key={role.id} value={role.id} description={role.description}>
                  {role.display_name}
                </CustomRadio>
              ))}
            </div>
          </RadioGroup>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Alert
          color={'warning'}
          title={translations.common.labels.note}
          description={translations.admin.userRoles.descriptions.skipRoleAssignment}
        />
      </UnifiedModal>

      <CategorySelectionModal
        isOpen={categoryModal.isOpen}
        onClose={categoryModal.onClose}
        onConfirm={handleCategoryConfirm}
        isLoading={loading}
      />
    </>
  );
}

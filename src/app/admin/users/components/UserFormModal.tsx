'use client';

import React, {useEffect, useState} from 'react';

import {
  Alert,
  Badge,
  Button,
  Input,
  Select,
  SelectItem,
  SharedSelection,
  Tab,
  Tabs,
  Textarea,
} from '@heroui/react';

import {PlusIcon} from '@heroicons/react/24/outline';

import {useModal} from '@/hooks/shared/useModals';

import {translations} from '@/lib/translations/index';

import {getCount, hasItems} from '@/utils/arrayHelper';

import {CategorySelectionModal} from '@/app/admin/users/components/CategorySelectionModal';
import {getRoleBadgeColor} from '@/app/admin/users/helpers/getRoleBadgeColorHelper';

import {Heading, showToast, UnifiedModal, UnifiedTable} from '@/components';
import {ActionTypes} from '@/enums';
import {formatDateString} from '@/helpers';
import {useFetchCategories, useFetchUserProfiles, useUserRoles} from '@/hooks';
import {CreateUserData, RoleDefinitionSchema, UserProfile} from '@/types';

interface UserFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser?: any | null;
  onSubmit: (formData: CreateUserData, isEdit: boolean) => Promise<void>;
  onSuccess?: () => void;
  isSubmitting?: boolean;
}

const TABS = [
  {key: 'basic', title: translations.common.tabs.basicInfo},
  {key: 'roles', title: translations.admin.users.tabs.rolesAndAccess},
];

const INITIAL_FORM_DATA: CreateUserData = {
  email: '',
  full_name: '',
  phone: '',
  bio: '',
  position: '',
};

export default function UserFormModal({
  isOpen,
  onOpenChange,
  selectedUser,
  onSubmit,
  onSuccess,
  isSubmitting,
}: UserFormModalProps) {
  const [formData, setFormData] = useState<CreateUserData>(() =>
    selectedUser
      ? {
          email: selectedUser.email || '',
          full_name: selectedUser.user_metadata?.full_name || '',
          phone: selectedUser.user_metadata?.phone || '',
          bio: selectedUser.user_metadata?.bio || '',
          position: selectedUser.user_metadata?.position || '',
        }
      : INITIAL_FORM_DATA
  );

  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [pendingRole, setPendingRole] = useState<RoleDefinitionSchema | null>(null);

  const {data: userProfiles, refetch: refetchProfiles} = useFetchUserProfiles({
    userId: selectedUser?.id ?? '',
  });

  const categoryModal = useModal();
  const {data: categories} = useFetchCategories();

  const {
    roleDefinitions,
    upsertUserProfile,
    deleteUserProfile,
    loading: roleLoading,
    checkRoleRequiresCategories,
    getRoleById,
    getRoleByName,
  } = useUserRoles();

  // Add new role
  const handleAddRole = async () => {
    if (!selectedRoleId || !selectedUser) return;

    const role = getRoleById(selectedRoleId);
    if (!role) return;

    // If role requires category, show category selection modal
    if (checkRoleRequiresCategories(selectedRoleId)) {
      setPendingRole(role);
      categoryModal.onOpen();
      return;
    }

    // For roles that don't require category, add directly
    await addRole(role, null);
  };

  // Add role to database using hook
  const addRole = async (role: RoleDefinitionSchema, categories: string[] | null) => {
    if (!selectedUser) return;

    const result = await upsertUserProfile({
      userId: selectedUser.id,
      roleId: role.id,
      roleName: role.name,
      assignedCategories: categories,
    });

    if (result.success) {
      showToast.success(translations.admin.users.success.roleCreated);
      setSelectedRoleId('');
      await refetchProfiles();
    } else {
      showToast.danger(`${translations.admin.users.errors.addRoleFailed} ${result.error}`);
    }
  };

  // Delete role
  const handleDeleteRole = async (profileId: string) => {
    if (!selectedUser) return;

    const result = await deleteUserProfile(profileId);

    if (result.success) {
      showToast.success(translations.admin.users.success.roleDeleted);
      await refetchProfiles();
    } else {
      showToast.danger(`${translations.admin.users.errors.deleteRoleFailed} ${result.error}`);
    }
  };

  // Get role label
  const getRoleLabel = (roleName: string): string => {
    const role = getRoleByName(roleName);
    return role?.display_name || roleName;
  };

  // Update form data when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      void refetchProfiles();
    }
  }, [selectedUser, refetchProfiles]);

  const handleSubmit = async () => {
    try {
      await onSubmit(formData, !!selectedUser);

      // Only call onSuccess for edit operations
      // For new user creation, the parent component handles the flow
      if (selectedUser) {
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error in user form:', error);
      showToast.danger(
        `Chyba při ukládání uživatele: ${error instanceof Error ? error.message : 'Neznámá chyba'}`
      );
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  // Basic info tab content - rendered inline to prevent focus loss on re-render
  const basicTabContent = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          isRequired
          label="Email"
          name="email"
          placeholder="uzivatel@example.cz"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          isReadOnly={!!selectedUser} // Read-only for existing users
          description={selectedUser ? 'Email nelze změnit' : undefined}
        />
        <Input
          isRequired
          label="Celé jméno"
          name="full_name"
          placeholder="Jan Novák"
          type="text"
          value={formData.full_name}
          onChange={(e) =>
            setFormData({
              ...formData,
              full_name: e.target.value,
            })
          }
        />
        <Input
          label="Telefon"
          name="phone"
          placeholder="+420 123 456 789"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
        />
        <Input
          label="Pozice"
          name="position"
          placeholder="Administrátor"
          type="text"
          value={formData.position}
          onChange={(e) => setFormData({...formData, position: e.target.value})}
        />
      </div>
      <Textarea
        label="Bio"
        name="bio"
        placeholder="Krátký popis uživatele..."
        value={formData.bio}
        onChange={(e) => setFormData({...formData, bio: e.target.value})}
        className="mt-4"
      />
      {!selectedUser && (
        <Alert
          color={'primary'}
          description={translations.admin.users.alert.newUserInfo}
          className={'mt-4'}
        />
      )}
    </>
  );

  // Handlers and config for roles tab - defined outside to prevent recreation
  const handleRoleSelectionChange = (keys: SharedSelection) => {
    const roleId = Array.from(keys)[0] as string;
    setSelectedRoleId(roleId);
  };

  const rolesColumns = [
    {key: 'role', label: translations.admin.userRoles.table.columns.role, isActionColumn: false},
    {
      key: 'categories',
      label: translations.admin.userRoles.table.columns.categories,
      isActionColumn: false,
    },
    {
      key: 'assignedAt',
      label: translations.admin.userRoles.table.columns.assignedAt,
      isActionColumn: false,
    },
    {
      key: 'actions',
      label: translations.common.table.columns.actions,
      isActionColumn: true,
      actions: [
        {
          type: ActionTypes.DELETE,
          onPress: (item: UserProfile) => handleDeleteRole(item.id),
          title: translations.common.actions.delete,
        },
      ],
    },
  ];

  const renderRolesCells = (item: UserProfile, columnKey: string) => {
    switch (columnKey) {
      case 'role':
        return (
          <Badge color={getRoleBadgeColor(item.role)} variant="flat">
            {getRoleLabel(item.role)}
          </Badge>
        );
      case 'categories':
        return hasItems(item.assigned_categories) ? (
          <div className="flex flex-wrap gap-1">
            {item?.assigned_categories?.slice(0, 2).map((catId) => {
              const category = categories.find((c) => c.id === catId);
              return (
                <Badge key={catId} size="sm" variant="flat" color="secondary">
                  {category?.name || catId}
                </Badge>
              );
            })}
            {getCount(item.assigned_categories) > 2 && (
              <Badge size="sm" variant="flat" color="default">
                +{getCount(item.assigned_categories) - 2}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400">Žádné</span>
        );
      case 'assignedAt':
        return <span className="text-sm">{formatDateString(item.created_at)}</span>;
    }
  };

  // Roles tab content - rendered inline to prevent focus loss on re-render
  const rolesTabContent = (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <Select
          label={translations.admin.users.labels.newRole}
          placeholder={translations.admin.users.labels.newRolePlaceholder}
          selectedKeys={selectedRoleId ? [selectedRoleId] : []}
          onSelectionChange={handleRoleSelectionChange}
          items={roleDefinitions}
          className="flex-1"
        >
          {(role) => (
            <SelectItem key={role.id} textValue={role.display_name}>
              <div className={'flex flex-col'}>
                <span>{role.display_name}</span>
                {role.description && (
                  <span className="text-xs text-gray-500">{role.description}</span>
                )}
              </div>
            </SelectItem>
          )}
        </Select>
        <Button
          color="primary"
          startContent={<PlusIcon className="h-4 w-4" />}
          onPress={handleAddRole}
          isDisabled={!selectedRoleId || roleLoading}
        >
          {translations.common.actions.add}
        </Button>
      </div>

      <div>
        <Heading size={4}>{translations.admin.userRoles.title.assignedRoles}</Heading>
        <UnifiedTable
          columns={rolesColumns}
          getKey={(item: UserProfile) => item.id}
          data={userProfiles}
          renderCell={renderRolesCells}
          ariaLabel={translations.admin.userRoles.table.ariaLabel}
        />
      </div>
    </div>
  );

  const handleCategoryModalConfirm = async (categories: string[]) => {
    if (!pendingRole || !selectedUser) return;

    try {
      await addRole(pendingRole, categories);
      categoryModal.onClose();
      setPendingRole(null);
    } catch (error) {
      showToast.danger(`${translations.admin.users.errors.categorySelectionFailed} ${error}`);
    }
  };

  const modalTitle = selectedUser
    ? translations.admin.users.modal.editUser
    : translations.admin.users.modal.addNewUser;

  return (
    <>
      <UnifiedModal
        isOpen={isOpen}
        onClose={handleClose}
        title={modalTitle}
        size={'2xl'}
        isFooterWithActions
        onPress={handleSubmit}
        isDisabled={isSubmitting || (!selectedUser && !formData.email)}
        isLoading={isSubmitting}
      >
        <Tabs aria-label="User form tabs" disabledKeys={!selectedUser ? [TABS[1].key] : []}>
          <Tab key="basic" title="Základní údaje">
            {basicTabContent}
          </Tab>
          <Tab key="roles" title="Role a přístup">
            {rolesTabContent}
          </Tab>
        </Tabs>
      </UnifiedModal>

      <CategorySelectionModal
        isOpen={categoryModal.isOpen}
        onClose={categoryModal.onClose}
        onConfirm={handleCategoryModalConfirm}
      />
    </>
  );
}

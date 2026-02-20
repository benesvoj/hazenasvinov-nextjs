'use client';

import {useState} from 'react';

import {Card, CardBody} from '@heroui/react';

import {useModals} from '@/hooks/shared/useModals';

import {translations} from '@/lib/translations/index';

import {AdminContainer, showToast} from '@/components';
import {ActionTypes} from '@/enums';
import {useFetchUsers, useUserManagement} from '@/hooks';
import {CreateUserData, SupabaseUser} from '@/types';

import {
  LoginLogsTab,
  PasswordResetModal,
  RoleAssignmentModal,
  UserFormModal,
  UsersTab,
} from './components';

export default function UsersPage() {
  const [selectedTab, setSelectedTab] = useState<string>('users');
  const {
    users,
    loginLogs,
    loading,
    error,
    pagination,
    changePage,
    changeUserFilter,
    clearFilters,
    fetchUsers,
  } = useFetchUsers(selectedTab === 'loginLogs');

  const {
    createUser,
    updateUser,
    toggleUserBlock,
    resetPassword,
    isCreating,
    isUpdating,
    isResettingPassword,
  } = useUserManagement();

  const modals = useModals('form', 'passwordReset', 'roleAssignment');

  const [selectedUser, setSelectedUser] = useState<SupabaseUser | null>(null);
  const [passwordResetEmail, setPasswordResetEmail] = useState<string>('');
  const [newlyCreatedUser, setNewlyCreatedUser] = useState<{id: string; email: string} | null>(
    null
  );

  const handleOpenAddModal = () => {
    setSelectedUser(null);
    modals.form.onOpen();
  };

  const handleOpenEditModal = (user: SupabaseUser) => {
    setSelectedUser(user);
    modals.form.onOpen();
  };

  const handleOpenPasswordResetModal = (user: SupabaseUser) => {
    setPasswordResetEmail(user.email || '');
    modals.passwordReset.onOpen();
  };

  const handleFormSubmit = async (formData: CreateUserData) => {
    if (selectedUser) {
      const result = await updateUser(selectedUser.id, formData);
      if (result.success) {
        showToast.success('Uživatel byl úspěšně aktualizován!');
        modals.form.onClose();
        fetchUsers();
      } else {
        showToast.danger(result.error || 'Nepodařilo se aktualizovat uživatele');
      }
    } else {
      const result = await createUser(formData);
      if (result.success && result.userId && result.userEmail) {
        showToast.success('Pozvánka byla úspěšně odeslána!');
        modals.form.onClose();
        setNewlyCreatedUser({id: result.userId, email: result.userEmail});
        modals.roleAssignment.onOpen();
      } else {
        showToast.danger(result.error || 'Nepodařilo se vytvořit uživatele');
      }
    }
  };

  const handleToggleBlock = async (user: SupabaseUser) => {
    const result = await toggleUserBlock(user.id);
    if (result.success) {
      fetchUsers();
    } else {
      showToast.danger(result.error || 'Nepodařilo se změnit stav uživatele');
    }
  };

  const handlePasswordReset = async () => {
    const result = await resetPassword(passwordResetEmail);
    if (result.success) {
      showToast.success('Email pro obnovení hesla byl odeslán');
      modals.passwordReset.onClose();
    } else {
      showToast.danger(result.error || 'Nepodařilo se odeslat email');
    }
  };

  const handleOnRoleAssigned = () => {
    modals.roleAssignment.onClose();
    setNewlyCreatedUser(null);
    showToast.success('Role byla úspěšně přiřazena!');
    fetchUsers();
  };

  const handleRoleAssignmentClose = () => {
    modals.roleAssignment.onClose();
    setNewlyCreatedUser(null);
    fetchUsers();
  };

  if (error) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Chyba při načítání</h3>
          <p className="text-foreground-600">{error.message}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <AdminContainer
        loading={loading}
        tabs={[
          {
            key: 'users',
            title: translations.admin.users.tabs.users,
            content: (
              <UsersTab
                users={users}
                loading={loading}
                onEdit={handleOpenEditModal}
                onResetPassword={handleOpenPasswordResetModal}
                onToggleBlock={handleToggleBlock}
              />
            ),
            actions: [
              {
                label: translations.admin.users.actions.addUser,
                onClick: handleOpenAddModal,
                variant: 'solid',
                buttonType: ActionTypes.CREATE,
              },
            ],
          },
          {
            key: 'loginLogs',
            title: translations.admin.users.tabs.loginLogs,
            content: (
              <LoginLogsTab
                loginLogs={loginLogs}
                loading={loading}
                users={users}
                pagination={pagination}
                onPageChange={changePage}
                onUserFilterChange={changeUserFilter}
                onClearFilters={clearFilters}
              />
            ),
          },
        ]}
        activeTab={selectedTab}
        onTabChange={setSelectedTab}
      />

      <UserFormModal
        isOpen={modals.form.isOpen}
        onOpenChange={modals.form.onOpenChange}
        key={selectedUser?.id ?? 'new-user'}
        selectedUser={selectedUser}
        onSubmit={handleFormSubmit}
        isSubmitting={isCreating || isUpdating}
      />

      <PasswordResetModal
        isOpen={modals.passwordReset.isOpen}
        onClose={modals.passwordReset.onClose}
        onSubmit={handlePasswordReset}
        passwordResetEmail={passwordResetEmail}
        isSubmitting={isResettingPassword}
      />

      {newlyCreatedUser && (
        <RoleAssignmentModal
          isOpen={modals.roleAssignment.isOpen}
          onClose={handleRoleAssignmentClose}
          userId={newlyCreatedUser.id}
          userEmail={newlyCreatedUser.email}
          onRoleAssigned={handleOnRoleAssigned}
        />
      )}
    </>
  );
}

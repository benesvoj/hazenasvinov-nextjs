'use client';

import React, { useState } from 'react';
import { useUserRoles, useCategories } from '@/hooks';
import { UserRoleSummary, RoleAssignment } from '@/types';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Checkbox,
  CheckboxGroup,
  Spinner,
  Divider,
} from '@heroui/react';
import { PencilIcon, UserIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/components/Toast';

export default function UserRolesPage() {
  const {
    userRoleSummaries,
    loading,
    error,
    fetchUserRoleSummaries,
    assignUserRoles,
  } = useUserRoles();

  const { categories, fetchCategories } = useCategories();

  const [selectedUser, setSelectedUser] = useState<UserRoleSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<('admin' | 'coach')[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openEditModal = (user: UserRoleSummary) => {
    setSelectedUser(user);
    setSelectedRoles((user.roles || []) as ('admin' | 'coach')[]);
    setSelectedCategories(user.assigned_categories || []);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setSelectedRoles([]);
    setSelectedCategories([]);
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);

      const assignment: RoleAssignment = {
        userId: selectedUser.user_id,
        roles: selectedRoles,
        categories: selectedCategories,
      };

      await assignUserRoles(assignment);
      showToast.success('Uživatelské role byly úspěšně aktualizovány');
      closeModal();
    } catch (error) {
      console.error('Error saving user roles:', error);
      showToast.danger('Chyba při ukládání uživatelských rolí');
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'coach':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrátor';
      case 'coach':
        return 'Trenér';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <div className="text-center text-red-600">
            <p>Chyba při načítání uživatelských rolí: {error}</p>
            <Button
              color="primary"
              variant="bordered"
              onPress={fetchUserRoleSummaries}
              className="mt-4"
            >
              Zkusit znovu
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Správa uživatelských rolí</h1>
          <p className="text-gray-600 mt-1">
            Spravujte role a oprávnění uživatelů v systému
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Uživatelé a jejich role</h2>
          </div>
        </CardHeader>
        <CardBody>
          <Table aria-label="User roles table">
            <TableHeader>
              <TableColumn>UŽIVATEL</TableColumn>
              <TableColumn>ROLE</TableColumn>
              <TableColumn>PŘIŘAZENÉ KATEGORIE</TableColumn>
              <TableColumn>AKCE</TableColumn>
            </TableHeader>
            <TableBody>
              {(userRoleSummaries || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="text-gray-500">
                      <UserIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Žádní uživatelé nebyli nalezeni</p>
                      <p className="text-sm">Ujistěte se, že máte nastavené uživatelské role v databázi</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Remove duplicates by user_id and map over unique users
                Array.from(
                  new Map((userRoleSummaries || []).map(user => [user.user_id, user])).values()
                ).map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.full_name || 'Neznámý uživatel'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(user.roles || []).length > 0 ? (
                        (user.roles || []).map((role) => (
                          <Chip
                            key={role}
                            size="sm"
                            color={getRoleColor(role)}
                            variant="solid"
                          >
                            {getRoleLabel(role)}
                          </Chip>
                        ))
                      ) : (
                        <Chip size="sm" color="default" variant="bordered">
                          Bez role
                        </Chip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(user.assigned_category_names || []).length > 0 ? (
                        (user.assigned_category_names || []).map((categoryName, index) => (
                          <Chip
                            key={index}
                            size="sm"
                            color="secondary"
                            variant="bordered"
                          >
                            {categoryName}
                          </Chip>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">Žádné kategorie</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="bordered"
                      isIconOnly
                      onPress={() => openEditModal(user)}
                      title="Upravit role"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <div>
              <h3 className="text-lg font-semibold">Upravit role uživatele</h3>
              <p className="text-sm text-gray-600">
                {selectedUser?.full_name} ({selectedUser?.email})
              </p>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Role Selection */}
              <div>
                <h4 className="font-medium mb-3">Role</h4>
                <CheckboxGroup
                  value={selectedRoles}
                  onValueChange={(values) => setSelectedRoles(values as ('admin' | 'coach')[])}
                >
                  <Checkbox value="admin">Administrátor - plný přístup do admin i trenérského portálu</Checkbox>
                  <Checkbox value="coach">Trenér - přístup pouze do trenérského portálu</Checkbox>
                </CheckboxGroup>
              </div>

              <Divider />

              {/* Category Selection (only for coaches) */}
              {selectedRoles.includes('coach') && (
                <div>
                  <h4 className="font-medium mb-3">Přiřazené kategorie (pro trenéry)</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Vyberte kategorie, ke kterým má trenér přístup
                  </p>
                  <CheckboxGroup
                    value={selectedCategories}
                    onValueChange={setSelectedCategories}
                  >
                    {(categories || []).map((category) => (
                      <Checkbox key={category.id} value={category.id}>
                        {category.name} ({category.code})
                      </Checkbox>
                    ))}
                  </CheckboxGroup>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              onPress={closeModal}
              disabled={saving}
            >
              Zrušit
            </Button>
            <Button
              color="primary"
              onPress={handleSave}
              isLoading={saving}
            >
              Uložit změny
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

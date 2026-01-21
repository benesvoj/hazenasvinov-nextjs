'use client';

import React, {useEffect, useState} from 'react';

import {Radio, RadioGroup} from '@heroui/react';

import {useModal} from '@/hooks/shared/useModals';

import {UnifiedModal} from '@/components/ui/modals';

import {createClient} from '@/utils/supabase/client';

import {CategorySelectionModal} from '@/app/admin/users/components/CategorySelectionModal';

import {useFetchCategories} from '@/hooks';

interface RoleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onRoleAssigned: () => void;
}

const ROLE_OPTIONS = [
  {value: 'admin', label: 'Admin', description: 'Plný přístup ke všem funkcím'},
  {
    value: 'head_coach',
    label: 'Hlavní trenér',
    description: 'Přístup k trenérským funkcím a správě týmů',
  },
  {value: 'coach', label: 'Trenér', description: 'Přístup k trenérským funkcím'},
  {value: 'member', label: 'Člen', description: 'Základní přístup pro členy'},
];

export default function RoleAssignmentModal({
  isOpen,
  onClose,
  userId,
  userEmail,
  onRoleAssigned,
}: RoleAssignmentModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Category selection state
  const {data: categories, refetch} = useFetchCategories();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const showCategoryModal = useModal();

  const [pendingRole, setPendingRole] = useState('');

  // Check if role requires category
  const roleRequiresCategories = (role: string) => {
    return role === 'coach' || role === 'head_coach';
  };

  // Load category on component mount
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const handleAssignRole = async () => {
    if (!selectedRole) {
      setError('Prosím vyberte roli');
      return;
    }

    // If role requires category, show category selection modal
    if (roleRequiresCategories(selectedRole)) {
      setPendingRole(selectedRole);
      setSelectedCategories([]);
      showCategoryModal.onOpen();
      return;
    }

    // For roles that don't require category, assign directly
    await assignRoleToDatabase(selectedRole, null);
  };

  // Assign role to database
  const assignRoleToDatabase = async (role: string, categories: string[] | null) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Create user profile with assigned role
      const {error: profileError} = await supabase.from('user_profiles').insert({
        user_id: userId,
        role: role,
        assigned_categories: categories,
      });

      if (profileError) {
        throw profileError;
      }

      onRoleAssigned();
      onClose();
    } catch (error: any) {
      console.error('Error assigning role:', error);
      setError(error.message || 'Chyba při přiřazování role');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle category selection confirmation
  const handleCategorySelectionConfirm = async () => {
    if (!pendingRole) return;

    await assignRoleToDatabase(pendingRole, selectedCategories);
    showCategoryModal.onClose();
    setPendingRole('');
    setSelectedCategories([]);
  };

  return (
    <>
      <UnifiedModal
        isFooterWithActions
        isOpen={isOpen}
        onClose={onClose}
        onPress={handleAssignRole}
        isDisabled={!selectedRole}
        title={'Přiřazení role uživateli'}
        size="md"
        placement="center"
        backdrop="blur"
      >
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Uživatel: <span className="font-medium">{userEmail}</span>
          </p>
          <p className="text-sm text-gray-500">
            Vyberte roli pro tohoto uživatele. Bez přiřazené role nebude mít přístup k aplikaci.
          </p>
        </div>

        <RadioGroup value={selectedRole} onValueChange={setSelectedRole} className="gap-3">
          {ROLE_OPTIONS.map((role) => (
            <Radio
              key={role.value}
              value={role.value}
              className="p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex flex-col">
                <div className="font-medium">{role.label}</div>
                <div className="text-sm text-gray-500">{role.description}</div>
              </div>
            </Radio>
          ))}
        </RadioGroup>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <p className="text-xs text-gray-500">
          Poznámka: Pokud přeskočíte, uživatel nebude mít přístup k aplikaci, dokud mu nebude
          přiřazena role.
        </p>
      </UnifiedModal>

      <CategorySelectionModal
        isOpen={showCategoryModal.isOpen}
        onClose={showCategoryModal.onClose}
        categories={categories || []}
        onConfirm={handleCategorySelectionConfirm}
        isLoading={isLoading}
      />
    </>
  );
}

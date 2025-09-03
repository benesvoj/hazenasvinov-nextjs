'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, RadioGroup, Radio } from '@heroui/react';
import { createClient } from '@/utils/supabase/client';

interface RoleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onRoleAssigned: () => void;
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', description: 'Plný přístup ke všem funkcím' },
  { value: 'head_coach', label: 'Hlavní trenér', description: 'Přístup k trenérským funkcím a správě týmů' },
  { value: 'coach', label: 'Trenér', description: 'Přístup k trenérským funkcím' },
  { value: 'member', label: 'Člen', description: 'Základní přístup pro členy' }
];

export default function RoleAssignmentModal({ 
  isOpen, 
  onClose, 
  userId, 
  userEmail, 
  onRoleAssigned 
}: RoleAssignmentModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssignRole = async () => {
    if (!selectedRole) {
      setError('Prosím vyberte roli');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Create user profile with assigned role
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          role: selectedRole,
          assigned_categories: selectedRole === 'coach' || selectedRole === 'head_coach' ? [] : null
        });

      if (profileError) {
        throw profileError;
      }

      // If it's a coach role, also create user_roles entries
      if (selectedRole === 'coach' || selectedRole === 'head_coach') {
        const { error: rolesError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: selectedRole,
            assigned_categories: []
          });

        if (rolesError) {
          console.warn('Could not create user_roles entry:', rolesError);
          // Don't throw here as the profile was created successfully
        }
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

  const handleSkip = () => {
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onClose}
      size="md"
      placement="center"
      backdrop="blur"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold">
                Přiřazení role uživateli
              </h3>
            </ModalHeader>
            
            <ModalBody>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Uživatel: <span className="font-medium">{userEmail}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Vyberte roli pro tohoto uživatele. Bez přiřazené role nebude mít přístup k aplikaci.
                </p>
              </div>

              <RadioGroup
                value={selectedRole}
                onValueChange={setSelectedRole}
                className="gap-3"
              >
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
                Poznámka: Pokud přeskočíte, uživatel nebude mít přístup k aplikaci, dokud mu nebude přiřazena role.
              </p>
            </ModalBody>
            
            <ModalFooter>
              <Button
                color="default"
                variant="light"
                onPress={handleSkip}
                isDisabled={isLoading}
              >
                Přeskočit
              </Button>
              <Button
                color="primary"
                onPress={handleAssignRole}
                isLoading={isLoading}
                isDisabled={!selectedRole}
              >
                {isLoading ? 'Přiřazování...' : 'Přiřadit roli'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

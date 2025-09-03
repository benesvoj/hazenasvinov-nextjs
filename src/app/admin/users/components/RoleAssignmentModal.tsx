'use client';

import { useState, useEffect } from 'react';
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
  
  // Category selection state
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [pendingRole, setPendingRole] = useState('');

  // Load categories
  const loadCategories = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Check if role requires categories
  const roleRequiresCategories = (role: string) => {
    return role === 'coach' || role === 'head_coach';
  };

  // Load categories on component mount
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const handleAssignRole = async () => {
    if (!selectedRole) {
      setError('Prosím vyberte roli');
      return;
    }

    // If role requires categories, show category selection modal
    if (roleRequiresCategories(selectedRole)) {
      setPendingRole(selectedRole);
      setSelectedCategories([]);
      setShowCategoryModal(true);
      return;
    }

    // For roles that don't require categories, assign directly
    await assignRoleToDatabase(selectedRole, null);
  };

  // Assign role to database
  const assignRoleToDatabase = async (role: string, categories: string[] | null) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Create user profile with assigned role
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          role: role,
          assigned_categories: categories
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
    setShowCategoryModal(false);
    setPendingRole('');
    setSelectedCategories([]);
  };

  // Handle category selection cancel
  const handleCategorySelectionCancel = () => {
    setShowCategoryModal(false);
    setPendingRole('');
    setSelectedCategories([]);
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <>
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

      {/* Category Selection Modal */}
      <Modal isOpen={showCategoryModal} onOpenChange={setShowCategoryModal} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Výběr kategorií</h3>
                <p className="text-sm text-gray-600">
                  Vyberte kategorie pro roli: <strong>{ROLE_OPTIONS.find(r => r.value === pendingRole)?.label}</strong>
                </p>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <p className="text-sm text-gray-700">
                    Kategorie můžete vybrat později, ale pro správné fungování systému je doporučeno přiřadit alespoň jednu kategorii.
                  </p>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Dostupné kategorie:
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                      {categories.map((category) => (
                        <label
                          key={category.id}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([...selectedCategories, category.id]);
                              } else {
                                setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                              }
                            }}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {selectedCategories.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Vybrané kategorie:</strong> {selectedCategories.length}
                      </p>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={handleCategorySelectionCancel}>
                  Zrušit
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleCategorySelectionConfirm}
                  isDisabled={selectedCategories.length === 0}
                >
                  Potvrdit výběr
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

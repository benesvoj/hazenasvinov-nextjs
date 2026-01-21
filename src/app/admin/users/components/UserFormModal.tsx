'use client';

import React, {useEffect, useState} from 'react';

import {
  Badge,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  Textarea,
} from '@heroui/react';

import {PlusIcon, TrashIcon} from '@heroicons/react/24/outline';

import {useModal} from '@/hooks/shared/useModals';

import {showToast} from '@/components/ui/feedback/Toast';

import {createClient} from '@/utils/supabase/client';

import {CategorySelectionModal} from '@/app/admin/users/components/CategorySelectionModal';
import {getRoleBadgeColor} from '@/app/admin/users/helpers/getRoleBadgeColorHelper';

import {ROLE_OPTIONS} from '@/constants';
import {useFetchCategories} from '@/hooks';

interface UserFormData {
  email: string;
  full_name: string;
  phone?: string;
  bio?: string;
  position?: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  role: string;
  assigned_categories: string[] | null;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface UserFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser?: any | null;
  onSubmit: (formData: UserFormData, isEdit: boolean) => Promise<void>;
  onSuccess?: () => void;
}

const TABS = [
  {key: 'basic', title: 'Základní údaje'},
  {key: 'roles', title: 'Role a přístup'},
];

export default function UserFormModal({
  isOpen,
  onOpenChange,
  selectedUser,
  onSubmit,
  onSuccess,
}: UserFormModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    full_name: '',
    phone: '',
    bio: '',
    position: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role management state
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [pendingRole, setPendingRole] = useState('');

  const categoryModal = useModal();

  // Load user profiles
  const loadUserProfiles = async (userId: string) => {
    if (!userId) return;

    setProfilesLoading(true);
    try {
      const supabase = createClient();
      const {data, error} = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', {ascending: false});

      if (error) throw error;
      setUserProfiles(data || []);
    } catch (error: any) {
      console.error('Error loading user profiles:', error);
      showToast.danger(`Chyba při načítání profilů: ${error.message}`);
    } finally {
      setProfilesLoading(false);
    }
  };

  const {data: categories} = useFetchCategories();

  // Check if role requires category
  const roleRequiresCategories = (role: string) => {
    return role === 'coach' || role === 'head_coach';
  };

  // Add new role
  const handleAddRole = async () => {
    if (!newRole || !selectedUser) return;

    // If role requires category, show category selection modal
    if (roleRequiresCategories(newRole)) {
      setPendingRole(newRole);
      categoryModal.onOpen();
      return;
    }

    // For roles that don't require category, add directly
    await addRoleToDatabase(newRole, null);
  };

  // Add role to database
  const addRoleToDatabase = async (role: string, categories: string[] | null) => {
    if (!selectedUser) return;

    try {
      const supabase = createClient();
      const {error} = await supabase.from('user_profiles').upsert(
        {
          user_id: selectedUser.id,
          role: role,
          assigned_categories: categories,
        },
        {
          onConflict: 'user_id,role',
          ignoreDuplicates: false,
        }
      );

      if (error) throw error;

      showToast.success('Role byla úspěšně přidána!');
      setNewRole('');

      // Only reload profiles if the component is still mounted and selectedUser exists
      if (selectedUser && selectedUser.id) {
        loadUserProfiles(selectedUser.id);
      }
    } catch (error: any) {
      console.error('Error adding role:', error);
      showToast.danger(`Chyba při přidávání role: ${error.message}`);
    }
  };

  // Delete role
  const handleDeleteRole = async (profileId: string) => {
    if (!selectedUser) return;

    try {
      const supabase = createClient();
      const {error} = await supabase.from('user_profiles').delete().eq('id', profileId);

      if (error) throw error;

      showToast.success('Role byla úspěšně smazána!');
      loadUserProfiles(selectedUser.id);
    } catch (error: any) {
      console.error('Error deleting role:', error);
      showToast.danger(`Chyba při mazání role: ${error.message}`);
    }
  };

  // Get role label
  const getRoleLabel = (role: string) => {
    const roleOption = ROLE_OPTIONS.find((r) => r.value === role);
    return roleOption?.label || role;
  };

  // Update form data when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      setFormData({
        email: selectedUser.email || '',
        full_name: selectedUser.user_metadata?.full_name || '',
        phone: selectedUser.user_metadata?.phone || '',
        bio: selectedUser.user_metadata?.bio || '',
        position: selectedUser.user_metadata?.position || '',
      });
      // Load user profiles when editing existing user
      loadUserProfiles(selectedUser.id);
    } else {
      setFormData({
        email: '',
        full_name: '',
        phone: '',
        bio: '',
        position: '',
      });
      setUserProfiles([]);
    }
  }, [selectedUser]);

  // Reset form when modal opens for new user
  useEffect(() => {
    if (isOpen && !selectedUser) {
      setFormData({
        email: '',
        full_name: '',
        phone: '',
        bio: '',
        position: '',
      });
      setUserProfiles([]);
      setNewRole('');
    }
  }, [isOpen, selectedUser]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const BasicTab = () => {
    return (
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-sm text-blue-800">
              Novému uživateli bude odeslán email s pozvánkou do systému.
            </p>
          </div>
        )}
      </>
    );
  };

  const RolesTab = () => {
    return (
      <>
        {selectedUser ? (
          <div className="space-y-4">
            {/* Add new role section */}
            <div className="flex gap-2 items-end">
              <Select
                label="Nová role"
                placeholder="Vyberte roli"
                selectedKeys={newRole ? [newRole] : []}
                onSelectionChange={(keys) => {
                  const role = Array.from(keys)[0] as string;
                  setNewRole(role);
                }}
                items={ROLE_OPTIONS}
                className="flex-1"
              >
                {(role) => <SelectItem key={role.value}>{role.label}</SelectItem>}
              </Select>
              <Button
                color="primary"
                startContent={<PlusIcon className="h-4 w-4" />}
                onPress={handleAddRole}
                isDisabled={!newRole}
              >
                Přidat
              </Button>
            </div>

            {/* Roles table */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Přiřazené role</h4>
              <Table aria-label="User roles table">
                <TableHeader>
                  <TableColumn>ROLE</TableColumn>
                  <TableColumn>KATEGORIE</TableColumn>
                  <TableColumn>VYTVOŘENO</TableColumn>
                  <TableColumn>AKCE</TableColumn>
                </TableHeader>
                <TableBody
                  isLoading={profilesLoading}
                  loadingContent="Načítání profilů..."
                  emptyContent="Žádné profily nenalezeny"
                >
                  {userProfiles.map((userProfile) => (
                    <TableRow key={userProfile.id}>
                      <TableCell>
                        <Badge color={getRoleBadgeColor(userProfile.role)} variant="flat">
                          {getRoleLabel(userProfile.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {userProfile.assigned_categories &&
                        userProfile.assigned_categories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {userProfile.assigned_categories.slice(0, 2).map((catId) => {
                              const category = categories.find((c) => c.id === catId);
                              return (
                                <Badge key={catId} size="sm" variant="flat" color="secondary">
                                  {category?.name || catId}
                                </Badge>
                              );
                            })}
                            {userProfile.assigned_categories.length > 2 && (
                              <Badge size="sm" variant="flat" color="default">
                                +{userProfile.assigned_categories.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Žádné</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(userProfile.created_at).toLocaleDateString('cs-CZ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleDeleteRole(userProfile.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Pro správu rolí nejprve vytvořte uživatele.</p>
          </div>
        )}
      </>
    );
  };

  const handleCategoryModalConfirm = async (categories: string[]) => {
    if (!pendingRole || !selectedUser) return;

    try {
      await addRoleToDatabase(pendingRole, categories);
      categoryModal.onClose();
      setPendingRole('');
    } catch (error) {
      console.error('Error in category selection confirm: ', error);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {selectedUser ? 'Upravit uživatele' : 'Přidat nového uživatele'}
          </ModalHeader>
          <ModalBody className="gap-4">
            <Tabs aria-label="User form tabs" disabledKeys={!selectedUser ? [TABS[1].key] : []}>
              <Tab key="basic" title="Základní údaje">
                <BasicTab />
              </Tab>
              <Tab key="roles" title="Role a přístup">
                <RolesTab />
              </Tab>
            </Tabs>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={handleClose}>
              Zrušit
            </Button>
            <Button color="primary" type="submit" isLoading={isSubmitting} onPress={handleSubmit}>
              {selectedUser ? 'Uložit změny' : 'Vytvořit uživatele'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <CategorySelectionModal
        isOpen={categoryModal.isOpen}
        onClose={categoryModal.onClose}
        onConfirm={handleCategoryModalConfirm}
      />
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { Select, SelectItem } from "@heroui/select";
import { Badge } from "@heroui/badge";
import { showToast } from "@/components/Toast";
import { Tab, Tabs } from "@heroui/tabs";
import { createClient } from "@/utils/supabase/client";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { ROLE_OPTIONS } from "@/constants";

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
  club_id?: string;
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

export default function UserFormModal({
  isOpen,
  onOpenChange,
  selectedUser,
  onSubmit,
  onSuccess,
}: UserFormModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    full_name: "",
    phone: "",
    bio: "",
    position: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Role management state
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  
  // Category selection modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pendingRole, setPendingRole] = useState("");

  // Load user profiles
  const loadUserProfiles = async (userId: string) => {
    if (!userId) return;
    
    setProfilesLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserProfiles(data || []);
    } catch (error: any) {
      console.error('Error loading user profiles:', error);
      showToast.danger(`Chyba při načítání profilů: ${error.message}`);
    } finally {
      setProfilesLoading(false);
    }
  };

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
    } catch (error: any) {
      console.error('Error loading categories:', error);
    }
  };

  // Check if role requires categories
  const roleRequiresCategories = (role: string) => {
    return role === 'coach' || role === 'head_coach';
  };

  // Add new role
  const handleAddRole = async () => {
    if (!newRole || !selectedUser) return;

    // If role requires categories, show category selection modal
    if (roleRequiresCategories(newRole)) {
      setPendingRole(newRole);
      setSelectedCategories([]);
      setShowCategoryModal(true);
      return;
    }

    // For roles that don't require categories, add directly
    await addRoleToDatabase(newRole, null);
  };

  // Add role to database
  const addRoleToDatabase = async (role: string, categories: string[] | null) => {
    if (!selectedUser) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: selectedUser.id,
          role: role,
          assigned_categories: categories,
          club_id: null // Default to null, can be set later
        });

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

  // Handle category selection confirmation
  const handleCategorySelectionConfirm = async () => {
    if (!pendingRole || !selectedUser) return;
    
    try {
      await addRoleToDatabase(pendingRole, selectedCategories);
      setShowCategoryModal(false);
      setPendingRole('');
      setSelectedCategories([]);
    } catch (error) {
      console.error('Error in category selection confirm:', error);
      // Don't close the modal if there was an error
    }
  };

  // Handle category selection cancel
  const handleCategorySelectionCancel = () => {
    setShowCategoryModal(false);
    setPendingRole('');
    setSelectedCategories([]);
  };

  // Delete role
  const handleDeleteRole = async (profileId: string) => {
    if (!selectedUser) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;
      
      showToast.success('Role byla úspěšně smazána!');
      loadUserProfiles(selectedUser.id);
    } catch (error: any) {
      console.error('Error deleting role:', error);
      showToast.danger(`Chyba při mazání role: ${error.message}`);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'head_coach': return 'warning';
      case 'coach': return 'primary';
      case 'member': return 'default';
      default: return 'default';
    }
  };

  // Get role label
  const getRoleLabel = (role: string) => {
    const roleOption = ROLE_OPTIONS.find(r => r.value === role);
    return roleOption?.label || role;
  };

  // Update form data when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      setFormData({
        email: selectedUser.email || "",
        full_name: selectedUser.user_metadata?.full_name || "",
        phone: selectedUser.user_metadata?.phone || "",
        bio: selectedUser.user_metadata?.bio || "",
        position: selectedUser.user_metadata?.position || "",
      });
      // Load user profiles when editing existing user
      loadUserProfiles(selectedUser.id);
    } else {
      setFormData({
        email: "",
        full_name: "",
        phone: "",
        bio: "",
        position: "",
      });
      setUserProfiles([]);
    }
  }, [selectedUser]);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Reset form when modal opens for new user
  useEffect(() => {
    if (isOpen && !selectedUser) {
      setFormData({
        email: "",
        full_name: "",
        phone: "",
        bio: "",
        position: "",
      });
      setUserProfiles([]);
      setNewRole("");
    }
  }, [isOpen, selectedUser]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData, !!selectedUser);
      
      // Only call onSuccess for edit operations
      // For new user creation, the parent component handles the flow
      if (selectedUser) {
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error in user form:", error);
      showToast.danger(
        `Chyba při ukládání uživatele: ${
          error instanceof Error ? error.message : "Neznámá chyba"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const TABS = [
    { key: "basic", title: "Základní údaje" },
    { key: "roles", title: "Role a přístup" },
  ];

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleSubmit}>
              <ModalHeader className="flex flex-col gap-1">
                {selectedUser ? "Upravit uživatele" : "Přidat nového uživatele"}
              </ModalHeader>
              <ModalBody className="gap-4">
                <Tabs
                  aria-label="User form tabs"
                  disabledKeys={!selectedUser ? [TABS[1].key] : []}
                >
                  <Tab key="basic" title="Základní údaje">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        isRequired
                        label="Email"
                        name="email"
                        placeholder="uzivatel@example.cz"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        isReadOnly={!!selectedUser} // Read-only for existing users
                        description={
                          selectedUser ? "Email nelze změnit" : undefined
                        }
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
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                      <Input
                        label="Pozice"
                        name="position"
                        placeholder="Administrátor"
                        type="text"
                        value={formData.position}
                        onChange={(e) =>
                          setFormData({ ...formData, position: e.target.value })
                        }
                      />
                    </div>
                    <Textarea
                      label="Bio"
                      name="bio"
                      placeholder="Krátký popis uživatele..."
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      className="mt-4"
                    />
                    {!selectedUser && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                        <p className="text-sm text-blue-800">
                          Novému uživateli bude odeslán email s pozvánkou do
                          systému.
                        </p>
                      </div>
                    )}
                  </Tab>
                  
                  <Tab key="roles" title="Role a přístup">
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
                            {(role) => (
                              <SelectItem key={role.value}>
                                {role.label}
                              </SelectItem>
                            )}
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
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Přiřazené role
                          </h4>
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
                                  {userProfile.assigned_categories && userProfile.assigned_categories.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {userProfile.assigned_categories.slice(0, 2).map((catId) => {
                                        const category = categories.find(c => c.id === catId);
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
                  </Tab>
                </Tabs>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={handleClose}>
                  Zrušit
                </Button>
                <Button color="primary" type="submit" isLoading={isSubmitting}>
                  {selectedUser ? "Uložit změny" : "Vytvořit uživatele"}
                </Button>
              </ModalFooter>
            </form>
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
                  Vyberte kategorie pro roli: <strong>{getRoleLabel(pendingRole)}</strong>
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

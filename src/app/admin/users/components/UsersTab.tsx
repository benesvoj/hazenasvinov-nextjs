'use client';

import {
  Avatar,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
  Chip,
} from '@heroui/react';
import {
  PlusIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  LockClosedIcon,
  LockOpenIcon,
  KeyIcon,
  UserIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import {SupabaseUser} from '@/types/types';
import {useState} from 'react';
import {showToast, LoadingSpinner} from '@/components';
import RoleAssignmentModal from '@/app/admin/users/components/RoleAssignmentModal';
import UserFormModal from '@/app/admin/users/components/UserFormModal';

interface UsersTabProps {
  users: SupabaseUser[];
  loading: boolean;
  onRefresh?: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({users, loading, onRefresh}) => {
  const {isOpen: isAddOpen, onOpen: onAddOpen, onOpenChange: onAddOpenChange} = useDisclosure();
  const {isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange} = useDisclosure();
  const {
    isOpen: isPasswordResetOpen,
    onOpen: onPasswordResetOpen,
    onOpenChange: onPasswordResetOpenChange,
  } = useDisclosure();

  const [selectedUser, setSelectedUser] = useState<SupabaseUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRoleAssignment, setShowRoleAssignment] = useState(false);
  const [newlyCreatedUser, setNewlyCreatedUser] = useState<{id: string; email: string} | null>(
    null
  );
  const [passwordResetEmail, setPasswordResetEmail] = useState('');

  // Initialize form data when adding new user
  const handleAddUser = () => {
    setSelectedUser(null);
    onAddOpen();
  };

  // Initialize form data when editing
  const handleEditUser = (user: SupabaseUser) => {
    setSelectedUser(user);
    onEditOpen();
  };

  // Handle form submission for adding/editing users
  const handleSubmit = async (formData: any, isEdit: boolean) => {
    try {
      const action = isEdit ? 'update' : 'create';
      const payload = {
        action,
        userData: formData,
        userId: selectedUser?.id,
      };

      const response = await fetch('/api/manage-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save user');
      }

      const responseData = await response.json();

      // If it's a new user creation, show role assignment modal
      if (action === 'create' && responseData.userId && responseData.userEmail) {
        // Close the user form modal first
        onAddOpenChange();
        setSelectedUser(null);

        // Then show role assignment modal
        setNewlyCreatedUser({
          id: responseData.userId,
          email: responseData.userEmail,
        });
        setShowRoleAssignment(true);
        showToast.success('Uživatel byl úspěšně vytvořen! Nyní přiřaďte roli.');
      } else {
        // For updates, refresh the users list
        showToast.success('Uživatel byl úspěšně aktualizován!');
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error saving user:', error);

      // Extract more specific error message
      let errorMessage = 'Nepodařilo se uložit uživatele';
      let errorDetails = '';

      if (error instanceof Error) {
        errorMessage = error.message;

        // Check if this is the database configuration error
        if (error.message.includes('problém s konfigurací databáze')) {
          errorDetails =
            'Zkuste vytvořit uživatele ručně přes Supabase dashboard a pak ho upravit zde.';
        }
      }

      // Show error with details if available
      if (errorDetails) {
        showToast.danger(`${errorMessage} - ${errorDetails}`);
      } else {
        showToast.danger(errorMessage);
      }

      throw error; // Re-throw to let the component handle it
    }
  };

  // Handle user blocking/unblocking
  const handleToggleUserStatus = async (user: SupabaseUser) => {
    try {
      const response = await fetch('/api/manage-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggleBlock',
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle user status');
      }

      // Refresh the users list to get updated data
      onRefresh?.();
    } catch (error) {
      console.error('Error toggling user status:', error);
      showToast.danger(
        `Chyba při změně stavu uživatele: ${error instanceof Error ? error.message : 'Neznámá chyba'}`
      );
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!passwordResetEmail) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: passwordResetEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send password reset');
      }

      showToast.success('Email pro obnovení hesla byl odeslán');
      onPasswordResetOpenChange();
      setPasswordResetEmail('');
    } catch (error) {
      console.error('Error sending password reset:', error);
      showToast.danger(
        `Chyba při odesílání emailu pro obnovení hesla: ${error instanceof Error ? error.message : 'Neznámá chyba'}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get user status badge
  const getUserStatusBadge = (user: SupabaseUser) => {
    const isBlocked = user.user_metadata?.is_blocked;
    const isConfirmed = user.email_confirmed_at;

    if (isBlocked) {
      return (
        <Chip color="danger" variant="flat" size="sm">
          Blokován
        </Chip>
      );
    }

    if (!isConfirmed) {
      return (
        <Chip color="warning" variant="flat" size="sm">
          Neověřen
        </Chip>
      );
    }

    return (
      <Chip color="success" variant="flat" size="sm">
        Aktivní
      </Chip>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <LoadingSpinner />
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center w-full">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-foreground">Správa uživatelů</h3>
              <p className="text-sm text-foreground-500 mt-1">
                Spravujte uživatele, kteří mají přístup do administrace
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <Button
                color="primary"
                size="sm"
                startContent={<PlusIcon className="w-4 h-4" />}
                onPress={handleAddUser}
              >
                Přidat uživatele
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <Table aria-label="Users table" selectionMode="none">
              <TableHeader>
                <TableColumn>UŽIVATEL</TableColumn>
                <TableColumn>KONTAKT</TableColumn>
                <TableColumn>STAV</TableColumn>
                <TableColumn>VYTVOŘENO</TableColumn>
                <TableColumn>AKCE</TableColumn>
              </TableHeader>
              <TableBody emptyContent={'Žádní uživatelé k zobrazení.'}>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={user.user_metadata?.full_name || user.email}
                          className="w-10 h-10 text-sm"
                          color={user.user_metadata?.is_blocked ? 'danger' : 'primary'}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {user.user_metadata?.full_name || 'Bez jména'}
                          </span>
                          <span className="text-xs text-foreground-500">
                            {user.user_metadata?.position || 'Bez pozice'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <EnvelopeIcon className="w-4 h-4 text-foreground-400" />
                          <span className="text-sm text-foreground">{user.email}</span>
                        </div>
                        {user.user_metadata?.phone && (
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-foreground-400" />
                            <span className="text-sm text-foreground-600">
                              {user.user_metadata.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getUserStatusBadge(user)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {new Date(user.created_at).toLocaleDateString('cs-CZ')}
                        </span>
                        <span className="text-xs text-foreground-500">
                          {new Date(user.created_at).toLocaleTimeString('cs-CZ', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light">
                            <EllipsisVerticalIcon className="w-4 h-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="User actions">
                          <DropdownItem
                            key="edit"
                            startContent={<PencilIcon className="w-4 h-4" />}
                            onPress={() => handleEditUser(user)}
                          >
                            Upravit
                          </DropdownItem>
                          <DropdownItem
                            key="password"
                            startContent={<KeyIcon className="w-4 h-4" />}
                            onPress={() => {
                              setPasswordResetEmail(user.email || '');
                              onPasswordResetOpen();
                            }}
                          >
                            Obnovit heslo
                          </DropdownItem>
                          <DropdownItem
                            key="toggle"
                            startContent={
                              user.user_metadata?.is_blocked ? (
                                <LockOpenIcon className="w-4 h-4" />
                              ) : (
                                <LockClosedIcon className="w-4 h-4" />
                              )
                            }
                            color={user.user_metadata?.is_blocked ? 'success' : 'danger'}
                            onPress={() => handleToggleUserStatus(user)}
                          >
                            {user.user_metadata?.is_blocked ? 'Odblokovat' : 'Blokovat'}
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>

      {/* Add/Edit User Modal */}
      <UserFormModal
        isOpen={isAddOpen || isEditOpen}
        onOpenChange={isAddOpen ? onAddOpenChange : onEditOpenChange}
        selectedUser={selectedUser}
        onSubmit={handleSubmit}
        onSuccess={() => {
          // Close modal and reset form
          if (isEditOpen) {
            onEditOpenChange();
          } else if (isAddOpen) {
            onAddOpenChange();
          }
          setSelectedUser(null);
        }}
      />

      {/* Password Reset Modal */}
      <Modal isOpen={isPasswordResetOpen} onOpenChange={onPasswordResetOpenChange} size="md">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Obnovení hesla</ModalHeader>
              <ModalBody>
                <p className="text-sm text-foreground-600 mb-4">
                  Uživateli bude odeslán email s odkazem pro vytvoření nového hesla.
                </p>
                <Input
                  label="Email uživatele"
                  labelPlacement="outside"
                  value={passwordResetEmail}
                  onChange={(e) => setPasswordResetEmail(e.target.value)}
                  placeholder="uzivatel@example.cz"
                  type="email"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Zrušit
                </Button>
                <Button
                  color="primary"
                  onPress={handlePasswordReset}
                  isLoading={isSubmitting}
                  isDisabled={!passwordResetEmail}
                >
                  Odeslat email
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Role Assignment Modal */}
      {newlyCreatedUser && (
        <RoleAssignmentModal
          isOpen={showRoleAssignment}
          onClose={() => {
            setShowRoleAssignment(false);
            setNewlyCreatedUser(null);
            // Refresh the users list to show updated data
            onRefresh?.();
          }}
          userId={newlyCreatedUser.id}
          userEmail={newlyCreatedUser.email}
          onRoleAssigned={() => {
            setShowRoleAssignment(false);
            setNewlyCreatedUser(null);
            showToast.success('Role byla úspěšně přiřazena!');
            // Refresh the users list to show updated data
            onRefresh?.();
          }}
        />
      )}
    </>
  );
};

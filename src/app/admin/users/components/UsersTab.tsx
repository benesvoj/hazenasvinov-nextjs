'use client';

import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/modal";
import { Input, Textarea } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { 
	PlusIcon, 
	EllipsisVerticalIcon,
	PencilIcon,
	LockClosedIcon,
	LockOpenIcon,
	KeyIcon,
	UserIcon,
	EnvelopeIcon,
	ShieldCheckIcon,
	ShieldExclamationIcon
} from "@heroicons/react/24/outline";
import { SupabaseUser } from "@/types/types";
import { useState } from "react";
import { showToast } from '@/components/Toast';
import RoleAssignmentModal from '@/components/RoleAssignmentModal';

interface UsersTabProps {
	users: SupabaseUser[];
	loading: boolean;
}

interface UserFormData {
	email: string;
	full_name: string;
	phone?: string;
	bio?: string;
	position?: string;
}

export const UsersTab: React.FC<UsersTabProps> = ({ users, loading }) => {
	const { isOpen: isAddOpen, onOpen: onAddOpen, onOpenChange: onAddOpenChange } = useDisclosure();
	const { isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange } = useDisclosure();
	const { isOpen: isPasswordResetOpen, onOpen: onPasswordResetOpen, onOpenChange: onPasswordResetOpenChange } = useDisclosure();
	
	const [selectedUser, setSelectedUser] = useState<SupabaseUser | null>(null);
	const [formData, setFormData] = useState<UserFormData>({
		email: '',
		full_name: '',
		phone: '',
		bio: '',
		position: ''
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showRoleAssignment, setShowRoleAssignment] = useState(false);
	const [newlyCreatedUser, setNewlyCreatedUser] = useState<{ id: string; email: string } | null>(null);
	const [passwordResetEmail, setPasswordResetEmail] = useState('');

	// Initialize form data when adding new user
	const handleAddUser = () => {
		setSelectedUser(null);
		setFormData({
			email: '',
			full_name: '',
			phone: '',
			bio: '',
			position: ''
		});
		onAddOpen();
	};

	// Initialize form data when editing
	const handleEditUser = (user: SupabaseUser) => {
		setSelectedUser(user);
		setFormData({
			email: user.email || '',
			full_name: user.user_metadata?.full_name || '',
			phone: user.user_metadata?.phone || '',
			bio: user.user_metadata?.bio || '',
			position: user.user_metadata?.position || ''
		});
		onEditOpen();
	};

	// Handle form submission for adding/editing users
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const action = selectedUser ? 'update' : 'create';
			const payload = {
				action,
				userData: formData,
				userId: selectedUser?.id
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

			// Close modal
			onEditOpenChange();
			onAddOpenChange();
			setSelectedUser(null);
			setFormData({ email: '', full_name: '', phone: '', bio: '', position: '' });
			
			// If it's a new user creation, show role assignment modal
			if (action === 'create' && responseData.userId && responseData.userEmail) {
				setNewlyCreatedUser({
					id: responseData.userId,
					email: responseData.userEmail
				});
				setShowRoleAssignment(true);
				showToast.success('Uživatel byl úspěšně vytvořen! Nyní přiřaďte roli.');
			} else {
				// For updates, just refresh
				showToast.success('Uživatel byl úspěšně aktualizován!');
				window.location.reload();
			}
		} catch (error) {
			console.error('Error saving user:', error);
			showToast.danger(`Chyba při ukládání uživatele: ${error instanceof Error ? error.message : 'Neznámá chyba'}`);
		} finally {
			setIsSubmitting(false);
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
					userId: user.id
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to toggle user status');
			}
			
			// Refresh the page to get updated data
			window.location.reload();
		} catch (error) {
			console.error('Error toggling user status:', error);
			showToast.danger(`Chyba při změně stavu uživatele: ${error instanceof Error ? error.message : 'Neznámá chyba'}`);
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
					email: passwordResetEmail
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
			showToast.danger(`Chyba při odesílání emailu pro obnovení hesla: ${error instanceof Error ? error.message : 'Neznámá chyba'}`);
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
				<Badge color="danger" variant="flat">
					<ShieldExclamationIcon className="w-3 h-3 mr-1" />
					Blokován
				</Badge>
			);
		}
		
		if (!isConfirmed) {
			return (
				<Badge color="warning" variant="flat">
					<EnvelopeIcon className="w-3 h-3 mr-1" />
					Neověřen
				</Badge>
			);
		}
		
		return (
			<Badge color="success" variant="flat">
				<ShieldCheckIcon className="w-3 h-3 mr-1" />
				Aktivní
			</Badge>
		);
	};

	// Get user initials for avatar
	const getUserInitials = (user: SupabaseUser) => {
		if (user.user_metadata?.full_name) {
			return user.user_metadata.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
		}
		return user.email?.charAt(0).toUpperCase() || 'U';
	};

	if (loading) {
		return (
			<Card>
				<CardBody className="text-center py-12">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-foreground-600">Načítání uživatelů...</p>
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
							<TableBody emptyContent={"Žádní uživatelé k zobrazení."}>
								{users.map((user) => (
									<TableRow key={user.id}>
										<TableCell>
											<div className="flex items-center gap-3">
												<Avatar 
													name={user.user_metadata?.full_name || user.email}
													className="w-10 h-10 text-sm"
													color={user.user_metadata?.is_blocked ? "danger" : "primary"}
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
														<span className="text-sm text-foreground-600">{user.user_metadata.phone}</span>
													</div>
												)}
											</div>
										</TableCell>
										<TableCell>
											{getUserStatusBadge(user)}
										</TableCell>
										<TableCell>
											<div className="flex flex-col">
												<span className="text-sm font-medium text-foreground">
													{new Date(user.created_at).toLocaleDateString('cs-CZ')}
												</span>
												<span className="text-xs text-foreground-500">
													{new Date(user.created_at).toLocaleTimeString('cs-CZ', {
														hour: '2-digit',
														minute: '2-digit'
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
														startContent={user.user_metadata?.is_blocked ? 
															<LockOpenIcon className="w-4 h-4" /> : 
															<LockClosedIcon className="w-4 h-4" />
														}
														color={user.user_metadata?.is_blocked ? "success" : "danger"}
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
			<Modal isOpen={isAddOpen || isEditOpen} onOpenChange={isAddOpen ? onAddOpenChange : onEditOpenChange} size="2xl">
				<ModalContent>
					{(onClose) => (
						<form onSubmit={handleSubmit}>
							<ModalHeader className="flex flex-col gap-1">
								{selectedUser ? 'Upravit uživatele' : 'Přidat nového uživatele'}
							</ModalHeader>
							<ModalBody className="gap-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<Input
										isRequired
										label="Email"
										labelPlacement="outside"
										name="email"
										placeholder="uzivatel@example.cz"
										type="email"
										value={formData.email}
										onChange={(e) => setFormData({...formData, email: e.target.value})}
										isReadOnly={!!selectedUser} // Read-only for existing users
										description={selectedUser ? "Email nelze změnit" : undefined}
									/>
									<Input
										isRequired
										label="Celé jméno"
										labelPlacement="outside"
										name="full_name"
										placeholder="Jan Novák"
										type="text"
										value={formData.full_name}
										onChange={(e) => setFormData({...formData, full_name: e.target.value})}
									/>
									<Input
										label="Telefon"
										labelPlacement="outside"
										name="phone"
										placeholder="+420 123 456 789"
										type="tel"
										value={formData.phone}
										onChange={(e) => setFormData({...formData, phone: e.target.value})}
									/>
									<Input
										label="Pozice"
										labelPlacement="outside"
										name="position"
										placeholder="Administrátor"
										type="text"
										value={formData.position}
										onChange={(e) => setFormData({...formData, position: e.target.value})}
									/>
								</div>
								<Textarea
									label="Bio"
									labelPlacement="outside"
									name="bio"
									placeholder="Krátký popis uživatele..."
									value={formData.bio}
									onChange={(e) => setFormData({...formData, bio: e.target.value})}
								/>
								{!selectedUser && (
									<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
										<p className="text-sm text-blue-800">
											Novému uživateli bude odeslán email s pozvánkou do systému.
										</p>
									</div>
								)}
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									Zrušit
								</Button>
								<Button color="primary" type="submit" isLoading={isSubmitting}>
									{selectedUser ? 'Uložit změny' : 'Vytvořit uživatele'}
								</Button>
							</ModalFooter>
						</form>
					)}
				</ModalContent>
			</Modal>

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
						window.location.reload(); // Refresh to show updated data
					}}
					userId={newlyCreatedUser.id}
					userEmail={newlyCreatedUser.email}
					onRoleAssigned={() => {
						setShowRoleAssignment(false);
						setNewlyCreatedUser(null);
						showToast.success('Role byla úspěšně přiřazena!');
						window.location.reload(); // Refresh to show updated data
					}}
				/>
			)}
		</>
	);
};

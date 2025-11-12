// TODO: refactor needed
'use client';

import React, {useEffect, useState} from 'react';

import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Chip,
	Skeleton,
	Spinner,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	Tabs,
	useDisclosure,
} from '@heroui/react';

import {PencilIcon, PlusIcon, TrashIcon, UserPlusIcon} from '@heroicons/react/24/outline';

import {useUserRoles} from '@/hooks/entities/user/useUserRoles';

import {LineupModal} from "@/app/coaches/lineups/components";
import {getPositionColor, getPositionText} from "@/app/coaches/lineups/helpers/helpers";

import {DeleteConfirmationModal, Heading, PageContainer} from '@/components';
import {ModalMode} from "@/enums";
import {
	useCategoryLineupForm,
	useCategoryLineupMember,
	useCategoryLineups,
	useFetchCategories,
	useFetchCategoryLineupMembers,
	useFetchCategoryLineups, useFetchSeasons
} from '@/hooks';
import {CategoryLineup, CreateCategoryLineupMember, UpdateCategoryLineupMember} from "@/types";

import AddMemberModal from './components/AddMemberModal';

export default function CoachesLineupsPage() {
	const [selectedCategory, setSelectedCategory] = useState<string>('');
	const [selectedSeason, setSelectedSeason] = useState<string>('');
	const [selectedLineup, setSelectedLineup] = useState<string>('');
	const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

	const {
		data: lineups,
		loading: loadingCatLineups,
		error: errorCalLineups,
		refetch
	} = useFetchCategoryLineups(selectedCategory, selectedSeason);

	const {
		data: lineupMembers,
		loading: loadingLineupMembers,
		error: errorLineupMembers,
		refetch: fetchLineupMembers,
	} = useFetchCategoryLineupMembers(selectedCategory, selectedLineup);

	const {
		loading,
		error,
		createLineup,
		updateLineup,
		deleteLineup,
	} = useCategoryLineups();
	const {createLineupMember, updateLineupMember, removeLineupMember} = useCategoryLineupMember();
	const {data: categories} = useFetchCategories();
	const {
		formData,
		setFormData,
		selectedLineupId,
		modalMode,
		openAddMode,
		openEditMode,
		validateForm,
		resetForm,
	} = useCategoryLineupForm()

	const {data: seasons, refetch: fetchAllSeasons} = useFetchSeasons();

	const {getCurrentUserCategories} = useUserRoles();

	// Get user's assigned category
	const [userCategories, setUserCategories] = useState<string[]>([]);

	const {
		isOpen: isLineupModalOpen,
		onOpen: onLineupModalOpen,
		onClose: onLineupModalClose,
	} = useDisclosure();

	const {
		isOpen: isAddMemberModalOpen,
		onOpen: onAddMemberModalOpen,
		onClose: onAddMemberModalClose,
	} = useDisclosure();

	const {
		isOpen: isDeleteModalOpen,
		onOpen: onDeleteModalOpen,
		onClose: onDeleteModalClose,
	} = useDisclosure();


	// Fetch initial data
	useEffect(() => {
		fetchAllSeasons();
	}, [fetchAllSeasons]);

	useEffect(() => {
		const fetchUserCategories = async () => {
			const categories = await getCurrentUserCategories();
			setUserCategories(categories);
			if (categories.length > 0 && !selectedCategory) {
				setSelectedCategory(categories[0]);
			}
		};
		fetchUserCategories();
	}, [getCurrentUserCategories]);

	// Get active season
	const activeSeason = seasons.find((season) => season.is_active);

	useEffect(() => {
		if (activeSeason && !selectedSeason) {
			setSelectedSeason(activeSeason.id);
		}
	}, [activeSeason, selectedSeason]);

	// Fetch lineup members when lineup changes
	useEffect(() => {
		if (selectedLineup && selectedSeason) {
			fetchLineupMembers();
		}
	}, [selectedLineup, fetchLineupMembers]);

	const handleAddClick = () => {
		openAddMode();
		onLineupModalOpen();
	}


	const handleEditLineup = (lineup: CategoryLineup) => {
		openEditMode(lineup.id, lineup);
		setFormData({
			name: lineup.name,
			description: lineup.description || '',
			category_id: lineup.category_id,
			season_id: lineup.season_id,
			created_by: lineup.created_by,
			is_active: lineup.is_active,
		});
		onLineupModalOpen();
	};

	const handleDeleteLineup = async (lineupId: string) => {
		if (confirm('Opravdu chcete smazat tento soupisku?')) {
			try {
				await deleteLineup(selectedCategory, lineupId);
				if (selectedLineup === lineupId) {
					setSelectedLineup('');
				}
			} catch (err) {
				console.error('Error deleting lineup:', err);
			}
		}
	};

	const handleDeleteClick = (memberId: string) => {
		setMemberToDelete(memberId)
		onDeleteModalOpen();
	};

	const handleConfirmDelete = async () => {
		if (memberToDelete && selectedCategory && selectedLineup) {
			try {
				await removeLineupMember(selectedCategory, selectedLineup, memberToDelete);
				await refetch();
				onDeleteModalClose();
				setMemberToDelete(null);
				resetForm();
			} catch (err) {
				console.error('Error deleting member:', err);
			}
		}
	};

	const handleAddMember = async (memberData: CreateCategoryLineupMember) => {
		if (!selectedCategory) {
			throw new Error('Není vybrána žádná kategorie.');
		}

		if (!selectedLineup) {
			throw new Error('Není vybrána žádná soupiska. Prosím vyberte soupisku před přidáním člena.');
		}

		try {
			await createLineupMember(selectedCategory, selectedLineup, memberData);
		} catch (err) {
			console.error('Error adding member:', err);
			throw err; // Re-throw to show error in modal
		}
	};

	const handleEditMember = async (memberData: UpdateCategoryLineupMember) => {
		if (!selectedCategory) {
			throw new Error('Není vybrána žádná kategorie.');
		}

		if (!selectedLineup) {
			throw new Error('Není vybrána žádná soupiska. Prosím vyberte soupisku před přidáním člena.');
		}

		try {
			await updateLineupMember(selectedCategory, selectedLineup, memberData.id, memberData);
		} catch (err) {
			console.error('Error updating member:', err);
			throw err; // Re-throw to show error in modal
		}
	};

	// Get existing member IDs and jersey numbers for the modal
	const existingMemberIds = lineupMembers.map((member) => member.member_id);
	const existingJerseyNumbers = lineupMembers
		.map((member) => member.jersey_number)
		.filter((num) => num !== null && num !== undefined) as number[];

	if (loading && !lineups.length) {
		return (
			<div className="p-6">
				<div className="flex items-center justify-center h-64">
					<Spinner size="lg"/>
				</div>
			</div>
		);
	}

	const handleSubmit = async () => {
		const {valid, errors} = validateForm();
		if (!valid) {
			console.error('Validation errors:', errors);
			return;
		}

		try {
			if (modalMode === ModalMode.EDIT && selectedLineupId) {
				await updateLineup(selectedCategory, selectedLineupId, formData);
			} else {
				await createLineup(formData);
			}
			await refetch();
			onLineupModalClose();
			resetForm();
		} catch (error) {
			console.error(error);
		}
	};

	const handleAddMemberToLineup = () => {
		onAddMemberModalOpen();
	}

	return (
		<>
			<PageContainer>
				{/* Category Tabs */}
				{userCategories.length > 1 && (
					<Card className="mb-6">
						<CardBody>
							<div className="overflow-x-auto">
								<Tabs
									selectedKey={selectedCategory}
									onSelectionChange={(key) => setSelectedCategory(key as string)}
									className="w-full min-w-max"
								>
									{userCategories.map((categoryId) => {
										const category = categories.find((c) => c.id === categoryId);
										return <Tab key={categoryId} title={category?.name || categoryId}/>;
									})}
								</Tabs>
							</div>
						</CardBody>
					</Card>
				)}

				{/* Content */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Lineups List */}
					<div className="lg:col-span-1">
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between w-full">
									<h3 className="text-lg font-semibold">Soupisky</h3>
									<Button
										size="sm"
										color="primary"
										startContent={<PlusIcon className="w-4 h-4"/>}
										onPress={handleAddClick}
										isDisabled={!selectedCategory || !selectedSeason}
									>
										Nová soupiska
									</Button>
								</div>
							</CardHeader>
							<CardBody>
								{loading ? (
									<div className="space-y-2">
										{[...Array(3)].map((_, i) => (
											<Skeleton key={i} className="h-16 rounded-lg"/>
										))}
									</div>
								) : lineups.length === 0 ? (
									<p className="text-gray-500 text-center py-4">Žádné soupisky</p>
								) : (
									<div className="space-y-2">
										{lineups.map((lineup) => (
											<div
												key={lineup.id}
												className={`p-3 rounded-lg border cursor-pointer transition-colors ${
													selectedLineup === lineup.id
														? 'border-green-500 bg-green-50'
														: 'border-gray-200 hover:border-gray-300'
												}`}
												onClick={() => setSelectedLineup(lineup.id)}
											>
												<div className="flex items-center justify-between">
													<div className="flex-1">
														<h4 className="font-medium text-sm">{lineup.name}</h4>
														{lineup.description && (
															<p className="text-xs text-gray-500 mt-1">{lineup.description}</p>
														)}
													</div>
													<div className="flex gap-1">
														<Button
															size="sm"
															variant="light"
															startContent={<PencilIcon className="w-4 h-4"/>}
															isIconOnly
															aria-label={`Upravit soupisku ${lineup.name}`}
															onPress={() => handleEditLineup(lineup)}
														/>
														<Button
															size="sm"
															color="danger"
															variant="light"
															onPress={() => handleDeleteLineup(lineup.id)}
															isIconOnly
															aria-label={`Smazat soupisku ${lineup.name}`}
															startContent={<TrashIcon className="w-4 h-4"/>}
														/>
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</CardBody>
						</Card>
					</div>

					{/* Lineup Members */}
					<div className="lg:col-span-2">
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between w-full">
									<Heading size={3}>
										Členové soupisky {selectedLineup ? `(${lineupMembers.length})` : ''}
									</Heading>
									{selectedLineup && (
										<Button
											size="sm"
											color="primary"
											startContent={<UserPlusIcon className="w-4 h-4"/>}
											onPress={handleAddMemberToLineup}
										>
											Přidat člena
										</Button>
									)}
								</div>
							</CardHeader>
							<CardBody>
								{!selectedLineup ? (
									<p className="text-gray-500 text-center py-8">
										Vyberte soupisku pro zobrazení členů
									</p>
								) : loading ? (
									<div className="space-y-2">
										{[...Array(5)].map((_, i) => (
											<Skeleton key={i} className="h-12 rounded-lg"/>
										))}
									</div>
								) : lineupMembers.length === 0 ? (
									<p className="text-gray-500 text-center py-8">Žádní členové v této soupisce</p>
								) : (
									<div className="overflow-x-auto">
										<Table aria-label="Lineup members">
											<TableHeader>
												<TableColumn>ČLEN</TableColumn>
												<TableColumn className="hidden sm:table-cell">POZICE</TableColumn>
												<TableColumn className="hidden md:table-cell">DRES</TableColumn>
												<TableColumn className="hidden lg:table-cell">FUNKCE</TableColumn>
												<TableColumn>AKCE</TableColumn>
											</TableHeader>
											<TableBody>
												{lineupMembers.map((member) => (
													<TableRow key={member.id}>
														<TableCell>
															<div>
																<div className="font-medium text-sm sm:text-base">
																	{member.members?.surname} {member.members?.name}
																</div>
																<div className="text-xs sm:text-sm text-gray-500">
																	{member.members?.registration_number}
																</div>
																<div className="flex gap-1 mt-1 sm:hidden">
																	<Chip
																		color={getPositionColor(member.position)}
																		size="sm"
																		className="text-xs"
																	>
																		{getPositionText(member.position)}
																	</Chip>
																	{member.jersey_number && (
																		<Chip
																			size="sm"
																			color="primary"
																			variant="flat"
																			className="text-xs"
																		>
																			#{member.jersey_number}
																		</Chip>
																	)}
																	{member.is_captain && (
																		<Chip size="sm" color="warning"
																			  className="text-xs">
																			K
																		</Chip>
																	)}
																</div>
															</div>
														</TableCell>
														<TableCell className="hidden sm:table-cell">
															<Chip color={getPositionColor(member.position)} size="sm">
																{getPositionText(member.position)}
															</Chip>
														</TableCell>
														<TableCell className="hidden md:table-cell">
															{member.jersey_number ? (
																<Chip size="sm" color="primary" variant="flat">
																	{member.jersey_number}
																</Chip>
															) : (
																<span className="text-gray-400">-</span>
															)}
														</TableCell>
														<TableCell className="hidden lg:table-cell">
															<div className="flex gap-1">
																{member.is_captain && (
																	<Chip size="sm" color="warning">
																		Kapitán
																	</Chip>
																)}
																{member.is_vice_captain && (
																	<Chip size="sm" color="secondary">
																		Zástupce
																	</Chip>
																)}
															</div>
														</TableCell>
														<TableCell>
															<div className="flex gap-1">
																<Button
																	size="sm"
																	variant="light"
																	onPress={() => handleEditMember(member)}
																	isIconOnly
																	aria-label={`Upravit ${member.members?.name} ${member.members?.surname}`}
																	startContent={<PencilIcon className="w-4 h-4"/>}
																/>
																<Button
																	size="sm"
																	color="danger"
																	variant="light"
																	onPress={() => handleDeleteClick(member.id)}
																	isIconOnly
																	aria-label={`Odebrat ${member.members?.name} ${member.members?.surname}`}
																	startContent={<TrashIcon className="w-4 h-4"/>}
																/>
															</div>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								)}
							</CardBody>
						</Card>
					</div>
				</div>
			</PageContainer>

			{/* Lineup Modal */}
			<LineupModal
				isOpen={isLineupModalOpen}
				onClose={onLineupModalClose}
				formData={formData}
				setFormData={setFormData}
				onSubmit={handleSubmit}
				mode={modalMode}
			/>

			{/* Add Member Modal */}
			<AddMemberModal
				isOpen={isLineupModalOpen}
				onClose={onLineupModalClose}
				onAddMember={handleAddMember}
				selectedCategoryName={categories.find((c) => c.id === selectedCategory)?.name || ''}
				selectedCategoryId={categories.find((c) => c.id === selectedCategory)?.id || ''}
				existingMembers={existingMemberIds}
				existingJerseyNumbers={existingJerseyNumbers}
			/>

			<DeleteConfirmationModal
				isOpen={isDeleteModalOpen}
				onClose={onDeleteModalOpen}
				onConfirm={handleConfirmDelete}
				title={'Odebrat člena soupisky'}
				message={'Opravdu chcete odebrat tohoto člena ze soupisky?'}
			/>
		</>
	);
}

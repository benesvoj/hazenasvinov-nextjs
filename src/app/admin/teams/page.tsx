'use client';

import React, {useCallback, useEffect, useState} from "react";
import {Card, CardBody} from "@heroui/card";
import {Button} from "@heroui/button";
import {Input} from "@heroui/input";
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@heroui/modal";
import {Badge} from "@heroui/badge";
import {
	BuildingOfficeIcon,
	CalendarIcon,
	CheckIcon,
	EnvelopeIcon,
	EyeIcon,
	GlobeAltIcon,
	HomeIcon,
	MapPinIcon,
	PencilIcon,
	PhoneIcon,
	PlusIcon,
	TrashIcon,
	UserGroupIcon,
	UserIcon,
	XMarkIcon
} from "@heroicons/react/24/outline";
import {createClient} from "@/utils/supabase/client";
import {deleteTeamLogo, uploadTeamLogo} from "@/utils/supabase/storage";
import {Chip, Select, SelectItem} from "@heroui/react";

interface Committee {
	id: string;
	name: string;
	code: string;
	description?: string;
	is_active: boolean;
	sort_order: number;
	created_at: string;
	updated_at: string;
}

interface Team {
	id: string;
	name: string;
	short_name?: string;
	city?: string;
	committee_id?: string;
	committee?: Committee;
	logo_url?: string;
	website?: string;
	email?: string;
	phone?: string;
	contact_person?: string;
	founded_year?: number;
	home_venue?: string;
	is_active: boolean;
	is_own_club?: boolean;
	created_at: string;
	updated_at: string;
}

interface Season {
	id: string;
	name: string;
	start_date: string;
	end_date: string;
	is_active: boolean;
}

interface Category {
	id: string;
	code: string;
	name: string;
	description?: string;
	age_group?: string;
	gender?: string;
	is_active: boolean;
	sort_order: number;
}

interface TeamCategory {
	id: string;
	team_id: string;
	season_id: string;
	category_id: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
	team?: Team;
	season?: Season;
	category?: Category;
}

export default function TeamsAdminPage() {
	const [teams, setTeams] = useState<Team[]>([]);
	const [committees, setCommittees] = useState<Committee[]>([]);
	const [seasons, setSeasons] = useState<Season[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [teamCategories, setTeamCategories] = useState<TeamCategory[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
	const [selectedSeason, setSelectedSeason] = useState<string>('');
	const [activeTab, setActiveTab] = useState<'details' | 'categories'>('details');
	const [existingOwnClub, setExistingOwnClub] = useState<Team | null>(null);
	const [selectedCommittee, setSelectedCommittee] = useState<string>('all');

	// Modal states
	const {isOpen: isAddTeamOpen, onOpen: onAddTeamOpen, onClose: onAddTeamClose} = useDisclosure();
	const {isOpen: isEditTeamOpen, onOpen: onEditTeamOpen, onClose: onEditTeamClose} = useDisclosure();
	const {isOpen: isViewTeamOpen, onOpen: onViewTeamOpen, onClose: onViewTeamClose} = useDisclosure();

	const [formData, setFormData] = useState({
		name: '',
		short_name: '',
		city: '',
		committee_id: '',
		logo_url: '',
		website: '',
		email: '',
		phone: '',
		contact_person: '',
		founded_year: '',
		home_venue: '',
		is_active: true,
		is_own_club: false
	});

	// Logo upload states
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [logoPreview, setLogoPreview] = useState<string>('');
	const [logoUploading, setLogoUploading] = useState(false);

	const [categoryFormData, setCategoryFormData] = useState({
		season_id: '',
		category_id: '',
		is_active: true
	});

	const supabase = createClient();

	// Fetch committees
	const fetchCommittees = useCallback(async () => {
		try {
			const {data, error} = await supabase
				.from('committees')
				.select('*')
				.eq('is_active', true)
				.order('sort_order', {ascending: true});

			if (error) throw error;
			setCommittees(data || []);
		} catch (error) {
			console.error('Error fetching committees:', error);
		}
	}, [supabase]);

	// Fetch teams
	const fetchTeams = useCallback(async () => {
		try {
			setLoading(true);
			const {data, error} = await supabase
				.from('teams')
				.select(`
          *,
          committee:committees(*)
        `)
				.order('name', {ascending: true});

			if (error) throw error;

			// Sort teams: own club first, then others alphabetically
			const sortedTeams = (data || []).sort((a, b) => {
				if (a.is_own_club && !b.is_own_club) return -1;
				if (!a.is_own_club && b.is_own_club) return 1;
				return a.name.localeCompare(b.name);
			});

			setTeams(sortedTeams);

			// Find existing own club
			const ownClub = data?.find(team => team.is_own_club);
			setExistingOwnClub(ownClub || null);
		} catch (error) {
			setError('Chyba při načítání týmů');
			console.error('Error fetching teams:', error);
		} finally {
			setLoading(false);
		}
	}, [supabase]);

	// Fetch seasons
	const fetchSeasons = useCallback(async () => {
		try {
			const {data, error} = await supabase
				.from('seasons')
				.select('*')
				.order('name', {ascending: false});

			if (error) throw error;
			setSeasons(data || []);
			if (data && data.length > 0) {
				setSelectedSeason(data[0].id);
				setCategoryFormData(prev => ({...prev, season_id: data[0].id}));
			}
		} catch (error) {
			console.error('Error fetching seasons:', error);
		}
	}, [supabase]);

	// Fetch categories
	const fetchCategories = useCallback(async () => {
		try {
			const {data, error} = await supabase
				.from('categories')
				.select('*')
				.eq('is_active', true)
				.order('sort_order', {ascending: true});

			if (error) throw error;
			setCategories(data || []);
			if (data && data.length > 0) {
				setCategoryFormData(prev => ({...prev, category_id: data[0].id}));
			}
		} catch (error) {
			console.error('Error fetching categories:', error);
		}
	}, [supabase]);

	// Fetch team categories
	const fetchTeamCategories = useCallback(async () => {
		if (!selectedTeam || !selectedSeason) return;

		try {
			const {data, error} = await supabase
				.from('team_categories')
				.select(`
          *,
          season:seasons(*),
          category:categories(*)
        `)
				.eq('team_id', selectedTeam.id)
				.eq('season_id', selectedSeason)
				.order('category_id', {ascending: true});

			if (error) throw error;
			setTeamCategories(data || []);
		} catch (error) {
			console.error('Error fetching team categories:', error);
		}
	}, [selectedTeam, selectedSeason, supabase]);

	useEffect(() => {
		fetchTeams();
		fetchCommittees();
		fetchSeasons();
		fetchCategories();
	}, [fetchTeams, fetchCommittees, fetchSeasons, fetchCategories]);

	useEffect(() => {
		if (selectedTeam && selectedSeason) {
			fetchTeamCategories();
		}
	}, [selectedTeam, selectedSeason, fetchTeamCategories]);

	// Add new team
	const handleAddTeam = async () => {
		try {
			const {error} = await supabase
				.from('teams')
				.insert({
					name: formData.name,
					short_name: formData.short_name || null,
					city: formData.city || null,
					committee_id: formData.committee_id || null,
					logo_url: formData.logo_url || null,
					website: formData.website || null,
					email: formData.email || null,
					phone: formData.phone || null,
					contact_person: formData.contact_person || null,
					founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
					home_venue: formData.home_venue || null,
					is_active: formData.is_active,
					is_own_club: existingOwnClub ? false : formData.is_own_club
				});

			if (error) throw error;

			handleCloseAddTeam();
			fetchTeams();
		} catch (error) {
			setError('Chyba při přidávání týmu');
			console.error('Error adding team:', error);
		}
	};

	// Update team
	const handleUpdateTeam = async () => {
		if (!selectedTeam) return;

		try {
			const {error} = await supabase
				.from('teams')
				.update({
					name: formData.name,
					short_name: formData.short_name || null,
					city: formData.city || null,
					committee_id: formData.committee_id || null,
					logo_url: formData.logo_url || null,
					website: formData.website || null,
					email: formData.email || null,
					phone: formData.phone || null,
					contact_person: formData.contact_person || null,
					founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
					home_venue: formData.home_venue || null,
					is_active: formData.is_active,
					is_own_club: existingOwnClub && !selectedTeam.is_own_club ? false : formData.is_own_club
				})
				.eq('id', selectedTeam.id);

			if (error) throw error;

			handleCloseEditTeam();
			fetchTeams();
		} catch (error) {
			setError('Chyba při aktualizaci týmu');
			console.error('Error updating team:', error);
		}
	};

	// Delete team
	const handleDeleteTeam = async (teamId: string) => {
		if (!confirm('Opravdu chcete smazat tento tým?')) return;

		try {
			const {error} = await supabase
				.from('teams')
				.delete()
				.eq('id', teamId);

			if (error) throw error;
			fetchTeams();
		} catch (error) {
			setError('Chyba při mazání týmu');
			console.error('Error deleting team:', error);
		}
	};


	// Open edit modal
	const handleEditTeam = (team: Team) => {
		setSelectedTeam(team);
		setFormData({
			name: team.name,
			short_name: team.short_name || '',
			city: team.city || '',
			committee_id: team.committee_id || '',
			logo_url: team.logo_url || '',
			website: team.website || '',
			email: team.email || '',
			phone: team.phone || '',
			contact_person: team.contact_person || '',
			founded_year: team.founded_year?.toString() || '',
			home_venue: team.home_venue || '',
			is_active: team.is_active,
			is_own_club: team.is_own_club || false
		});
		setLogoPreview(team.logo_url || '');
		onEditTeamOpen();
	};

	// Open view modal
	const handleViewTeam = (team: Team) => {
		setSelectedTeam(team);
		setActiveTab('details');
		onViewTeamOpen();
	};

	// Logo upload handlers
	const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setLogoFile(file);

			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				setLogoPreview(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleLogoUpload = async (teamId: string) => {
		if (!logoFile) return false;

		try {
			setLogoUploading(true);
			const result = await uploadTeamLogo(teamId, logoFile);

			if (result.success) {
				setFormData(prev => ({...prev, logo_url: result.url || ''}));
				setLogoFile(null);
				setLogoPreview('');
				await fetchTeams(); // Refresh teams list
				return true;
			} else {
				setError(result.error || 'Failed to upload logo');
				return false;
			}
		} catch (error) {
			setError('Error uploading logo');
			console.error('Logo upload error:', error);
			return false;
		} finally {
			setLogoUploading(false);
		}
	};

	const handleLogoDelete = async (teamId: string) => {
		try {
			setLogoUploading(true);
			const success = await deleteTeamLogo(teamId);

			if (success) {
				setFormData(prev => ({...prev, logo_url: ''}));
				await fetchTeams(); // Refresh teams list
			} else {
				setError('Failed to delete logo');
			}
		} catch (error) {
			setError('Error deleting logo');
			console.error('Logo delete error:', error);
		} finally {
			setLogoUploading(false);
		}
	};

	const clearLogoPreview = () => {
		setLogoFile(null);
		setLogoPreview('');
	};

	// Handle opening add team modal with clean form
	const handleOpenAddTeam = () => {
		setFormData({
			name: '',
			short_name: '',
			city: '',
			committee_id: '',
			logo_url: '',
			website: '',
			email: '',
			phone: '',
			contact_person: '',
			founded_year: '',
			home_venue: '',
			is_active: true,
			is_own_club: false
		});
		clearLogoPreview();
		onAddTeamOpen();
	};

	// Handle closing edit team modal with clean form
	const handleCloseEditTeam = () => {
		setFormData({
			name: '',
			short_name: '',
			city: '',
			committee_id: '',
			logo_url: '',
			website: '',
			email: '',
			phone: '',
			contact_person: '',
			founded_year: '',
			home_venue: '',
			is_active: true,
			is_own_club: false
		});
		clearLogoPreview();
		setSelectedTeam(null);
		onEditTeamClose();
	};

	// Handle closing add team modal with clean form
	const handleCloseAddTeam = () => {
		setFormData({
			name: '',
			short_name: '',
			city: '',
			committee_id: '',
			logo_url: '',
			website: '',
			email: '',
			phone: '',
			contact_person: '',
			founded_year: '',
			home_venue: '',
			is_active: true,
			is_own_club: false
		});
		clearLogoPreview();
		onAddTeamClose();
	};

	// Add team category
	const handleAddTeamCategory = async () => {
		if (!selectedTeam) return;

		try {
			const {error} = await supabase
				.from('team_categories')
				.insert({
					team_id: selectedTeam.id,
					season_id: categoryFormData.season_id,
					category_id: categoryFormData.category_id,
					is_active: categoryFormData.is_active
				});

			if (error) throw error;

			setCategoryFormData({
				season_id: selectedSeason,
				category_id: categories.length > 0 ? categories[0].id : '',
				is_active: true
			});
			fetchTeamCategories();
		} catch (error) {
			setError('Chyba při přidávání kategorie týmu');
			console.error('Error adding team category:', error);
		}
	};

	// Add all categories to team
	const handleAddAllCategories = async () => {
		if (!selectedTeam) return;

		try {
			// Get existing category IDs for this team and season
			const existingCategoryIds = teamCategories.map(tc => tc.category_id);

			// Filter out categories that are already assigned
			const categoriesToAdd = categories.filter(category =>
				!existingCategoryIds.includes(category.id)
			);

			if (categoriesToAdd.length === 0) {
				setError('Všechny kategorie jsou již přiřazeny');
				return;
			}

			// Prepare data for bulk insert
			const categoriesData = categoriesToAdd.map(category => ({
				team_id: selectedTeam.id,
				season_id: selectedSeason,
				category_id: category.id,
				is_active: true
			}));

			const {error} = await supabase
				.from('team_categories')
				.insert(categoriesData);

			if (error) throw error;

			fetchTeamCategories();
			setError('');
		} catch (error) {
			setError('Chyba při přidávání všech kategorií');
			console.error('Error adding all categories:', error);
		}
	};

	// Delete team category
	const handleDeleteTeamCategory = async (categoryId: string) => {
		try {
			const {error} = await supabase
				.from('team_categories')
				.delete()
				.eq('id', categoryId);

			if (error) throw error;
			fetchTeamCategories();
		} catch (error) {
			setError('Chyba při mazání kategorie týmu');
			console.error('Error deleting team category:', error);
		}
	};

	// Get category badge color
	const getCategoryBadgeColor = (categoryCode: string) => {
		switch (categoryCode) {
			case 'men':
				return 'primary';
			case 'women':
				return 'secondary';
			case 'juniorBoys':
				return 'success';
			case 'juniorGirls':
				return 'warning';
			case 'prepKids':
				return 'danger';
			case 'youngestKids':
				return 'default';
			case 'youngerBoys':
				return 'primary';
			case 'youngerGirls':
				return 'secondary';
			case 'olderBoys':
				return 'success';
			case 'olderGirls':
				return 'warning';
			default:
				return 'default';
		}
	};

	const getStatusBadge = (isActive: boolean) => {
		return isActive ? (
			<Chip color="primary" variant="shadow">Aktivní</Chip>
		) : (
			<Chip color="danger" variant="flat">Neaktivní</Chip>
		);
	};

	return (
		<div className="max-w-7xl mx-auto space-y-8">
			{/* Action Buttons */}
			<div className="flex justify-between items-center pt-4">
				<h2 className="text-2xl font-bold">Seznam týmů</h2>
				<Button
					color="primary"
					startContent={<PlusIcon className="w-4 h-4"/>}
					onPress={handleOpenAddTeam}
				>
					Přidat tým
				</Button>
			</div>

			{/* Error Message */}
			{error && (
				<div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
					{error}
				</div>
			)}

			{/* Committee Filter Tabs */}
			<div className="mb-6">
				<div className="flex flex-wrap gap-2">
					<button
						onClick={() => setSelectedCommittee('all')}
						className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
							selectedCommittee === 'all'
								? 'bg-blue-600 text-white'
								: 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
						}`}
					>
						Všechny komise ({teams.length})
					</button>
					{committees.map((committee) => (
						<button
							key={committee.id}
							onClick={() => setSelectedCommittee(committee.id)}
							className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
								selectedCommittee === committee.id
									? 'bg-blue-600 text-white'
									: 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
							}`}
						>
							{committee.name} ({teams.filter(team => team.committee_id === committee.id).length})
						</button>
					))}
				</div>
			</div>

			{/* Teams List */}
			<Card>
				<CardBody>
					{loading ? (
						<div className="text-center py-8">Načítání...</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{teams
								.filter(team => selectedCommittee === 'all' || team.committee_id === selectedCommittee)
								.map((team) => (
									<div
										key={team.id}
										className={`border rounded-lg p-6 transition-all duration-200 ${
											team.is_own_club
												? 'border-green-500 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 shadow-lg'
												: 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
										}`}
									>
										<div className="flex items-start justify-between mb-4">
											<div className="flex items-center gap-3">
												{team.logo_url ? (
													<img
														src={team.logo_url}
														alt={`${team.name} logo`}
														className="w-8 h-8 object-contain"
														onError={(e) => {
															// Fallback to icon if image fails to load
															e.currentTarget.style.display = 'none';
															e.currentTarget.nextElementSibling?.classList.remove('hidden');
														}}
													/>
												) : null}
												<BuildingOfficeIcon
													className={`w-8 h-8 ${team.is_own_club ? 'text-green-600' : 'text-blue-600'} ${team.logo_url ? 'hidden' : ''}`}
												/>
												<div>
													<h3 className={`text-lg font-semibold ${team.is_own_club ? 'text-green-800 dark:text-green-200' : ''}`}>
														{team.name}
													</h3>
													{team.short_name && (
														<p className={`text-sm ${team.is_own_club ? 'text-green-600 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
															{team.short_name}
														</p>
													)}
													{team.is_own_club && (
														<Badge color="success" variant="solid" size="sm"
															   className="mt-1">
															⭐ Domovský klub
														</Badge>
													)}
												</div>
											</div>
											{getStatusBadge(team.is_active)}
										</div>

										<div className="space-y-2 mb-4">
											{team.city && (
												<div className="flex items-center gap-2 text-sm">
													<MapPinIcon className="w-4 h-4 text-gray-500"/>
													<span>{team.city}</span>
													{team.committee?.name &&
                                                        <span className="text-gray-500">({team.committee.name})</span>}
												</div>
											)}
											{team.home_venue && (
												<div className="flex items-center gap-2 text-sm">
													<HomeIcon className="w-4 h-4 text-gray-500"/>
													<span>{team.home_venue}</span>
												</div>
											)}
											{team.contact_person && (
												<div className="flex items-center gap-2 text-sm">
													<UserIcon className="w-4 h-4 text-gray-500"/>
													<span>{team.contact_person}</span>
												</div>
											)}
										</div>

										<div className="flex items-center justify-between">
											<div className="flex gap-2">
												<Button
													size="sm"
													color="primary"
													variant="flat"
													startContent={<EyeIcon className="w-3 h-3"/>}
													onPress={() => handleViewTeam(team)}
												>
													Zobrazit
												</Button>
												<Button
													size="sm"
													color="secondary"
													variant="flat"
													startContent={<PencilIcon className="w-3 h-3"/>}
													onPress={() => handleEditTeam(team)}
												>
													Upravit
												</Button>
											</div>
											<Button
												size="sm"
												color="danger"
												variant="flat"
												startContent={<TrashIcon className="w-3 h-3"/>}
												onPress={() => handleDeleteTeam(team.id)}
											>
												Smazat
											</Button>
										</div>
									</div>
								))}
							{teams.length === 0 && (
								<div className="col-span-full text-center py-8 text-gray-500">
									Žádné týmy nebyly nalezeny
								</div>
							)}
						</div>
					)}
				</CardBody>
			</Card>

			{/* Add Team Modal */}
			<Modal isOpen={isAddTeamOpen} onClose={handleCloseAddTeam} size="3xl">
				<ModalContent>
					<ModalHeader>Přidat nový tým</ModalHeader>
					<ModalBody>
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Left Column */}
							<div className="space-y-4">
								<h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2">Základní
									údaje</h4>
								<Input
									label="Název týmu *"
									value={formData.name}
									onChange={(e) => setFormData({...formData, name: e.target.value})}
									required
								/>
								<Input
									label="Zkratka"
									value={formData.short_name}
									onChange={(e) => setFormData({...formData, short_name: e.target.value})}
								/>
								<div className="grid grid-cols-2 gap-3">
									<Input
										label="Město"
										value={formData.city}
										onChange={(e) => setFormData({...formData, city: e.target.value})}
									/>
								</div>
                                 <Select 
                     className='max-w' 
                     label='Komise' 
                     placeholder='Vyberte komisi'
                     selectedKeys={formData.committee_id ? [formData.committee_id] : []}
                     onSelectionChange={(keys) => {
                       const selectedKey = Array.from(keys)[0] as string;
                       setFormData({...formData, committee_id: selectedKey || ''});
                     }}
                   >
                    {committees.map((committee) => (
                      <SelectItem key={committee.id}>{committee.name}</SelectItem>
                    ))}
                </Select>
								<Input
									label="Domácí hala"
									value={formData.home_venue}
									onChange={(e) => setFormData({...formData, home_venue: e.target.value})}
								/>
								<Input
									label="Rok založení"
									type="number"
									value={formData.founded_year}
									onChange={(e) => setFormData({...formData, founded_year: e.target.value})}
								/>
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="add_is_own_club"
										checked={formData.is_own_club}
										onChange={(e) => setFormData({...formData, is_own_club: e.target.checked})}
										disabled={existingOwnClub !== null}
										className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
									/>
									<label htmlFor="add_is_own_club"
										   className={`text-sm font-medium ${existingOwnClub ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
										Nastavit jako vlastní klub
										{existingOwnClub && (
											<span className="block text-xs text-gray-500 mt-1">
                        Již existuje vlastní klub: {existingOwnClub.name}
                      </span>
										)}
									</label>
								</div>
							</div>

							{/* Right Column */}
							<div className="space-y-4">
								<h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2">Kontaktní
									údaje</h4>
								<Input
									label="Webové stránky"
									value={formData.website}
									onChange={(e) => setFormData({...formData, website: e.target.value})}
								/>
								<Input
									label="Email"
									type="email"
									value={formData.email}
									onChange={(e) => setFormData({...formData, email: e.target.value})}
								/>
								<Input
									label="Telefon"
									value={formData.phone}
									onChange={(e) => setFormData({...formData, phone: e.target.value})}
								/>
								<Input
									label="Kontaktní osoba"
									value={formData.contact_person}
									onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
								/>

								{/* Logo Upload Section */}
								<div className="space-y-3 pt-2">
									<h5 className="font-medium text-gray-900 dark:text-gray-100">Logo týmu</h5>

									{/* Current logo preview */}
									{(logoPreview || formData.logo_url) && (
										<div className="flex items-center gap-3">
											<img
												src={logoPreview || formData.logo_url}
												alt="Logo preview"
												className="w-16 h-16 object-contain border rounded-lg bg-gray-50"
											/>
											<Button
												size="sm"
												color="danger"
												variant="flat"
												onPress={clearLogoPreview}
											>
												Odstranit
											</Button>
										</div>
									)}

									{/* File upload */}
									<input
										type="file"
										accept="image/jpeg,image/jpg,image/png,image/webp"
										onChange={handleLogoFileChange}
										className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
									/>
									<p className="text-xs text-gray-500">
										Podporované formáty: JPEG, PNG, WebP (max 2MB)
									</p>
								</div>
							</div>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color="danger" variant="flat" onPress={handleCloseAddTeam}>
							Zrušit
						</Button>
						<Button color="primary" onPress={handleAddTeam}>
							Přidat tým
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			{/* Edit Team Modal */}
			<Modal isOpen={isEditTeamOpen} onClose={handleCloseEditTeam} size="3xl">
				<ModalContent>
					<ModalHeader>Upravit tým</ModalHeader>
					<ModalBody>
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Left Column */}
							<div className="space-y-4">
								<h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2">Základní
									údaje</h4>
								<Input
									label="Název týmu *"
									value={formData.name}
									onChange={(e) => setFormData({...formData, name: e.target.value})}
									required
								/>
								<Input
									label="Zkratka"
									value={formData.short_name}
									onChange={(e) => setFormData({...formData, short_name: e.target.value})}
								/>
								<div className="grid grid-cols-2 gap-3">
									<Input
										label="Město"
										value={formData.city}
										onChange={(e) => setFormData({...formData, city: e.target.value})}
									/>
								</div>
                <Select 
                    className='max-w' 
                    label='Komise' 
                    placeholder='Vyberte komisi'
                    selectedKeys={formData.committee_id ? [formData.committee_id] : []}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      setFormData({...formData, committee_id: selectedKey || ''});
                    }}
                  >
                    {committees.map((committee) => (
                      <SelectItem key={committee.id}>{committee.name}</SelectItem>
                    ))}
                </Select>
								<Input
									label="Domácí hala"
									value={formData.home_venue}
									onChange={(e) => setFormData({...formData, home_venue: e.target.value})}
								/>
								<Input
									label="Rok založení"
									type="number"
									value={formData.founded_year}
									onChange={(e) => setFormData({...formData, founded_year: e.target.value})}
								/>
								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="edit_is_own_club"
										checked={formData.is_own_club}
										onChange={(e) => setFormData({...formData, is_own_club: e.target.checked})}
										disabled={existingOwnClub !== null && !selectedTeam?.is_own_club}
										className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
									/>
									<label htmlFor="edit_is_own_club"
										   className={`text-sm font-medium ${existingOwnClub && !selectedTeam?.is_own_club ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
										Nastavit jako vlastní klub
										{existingOwnClub && !selectedTeam?.is_own_club && (
											<span className="block text-xs text-gray-500 mt-1">
                        Již existuje vlastní klub: {existingOwnClub.name}
                      </span>
										)}
									</label>
								</div>
							</div>

							{/* Right Column */}
							<div className="space-y-4">
								<h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 border-b pb-2">Kontaktní
									údaje & Logo</h4>
								<Input
									label="Webové stránky"
									value={formData.website}
									onChange={(e) => setFormData({...formData, website: e.target.value})}
								/>
								<Input
									label="Email"
									type="email"
									value={formData.email}
									onChange={(e) => setFormData({...formData, email: e.target.value})}
								/>
								<Input
									label="Telefon"
									value={formData.phone}
									onChange={(e) => setFormData({...formData, phone: e.target.value})}
								/>
								<Input
									label="Kontaktní osoba"
									value={formData.contact_person}
									onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
								/>

								{/* Logo Upload Section */}
								<div className="space-y-3 pt-2">
									<h5 className="font-medium text-gray-900 dark:text-gray-100">Logo týmu</h5>

									{/* Current logo preview */}
									{(logoPreview || formData.logo_url) && (
										<div className="flex items-center gap-3">
											<img
												src={logoPreview || formData.logo_url}
												alt="Logo preview"
												className="w-16 h-16 object-contain border rounded-lg bg-gray-50"
											/>
											<div className="flex flex-col gap-2">
												<Button
													size="sm"
													color="danger"
													variant="flat"
													onPress={clearLogoPreview}
												>
													Odstranit náhled
												</Button>
												{selectedTeam && (
													<Button
														size="sm"
														color="danger"
														variant="solid"
														onPress={() => handleLogoDelete(selectedTeam.id)}
														isLoading={logoUploading}
													>
														Smazat logo
													</Button>
												)}
											</div>
										</div>
									)}

									{/* File upload */}
									<input
										type="file"
										accept="image/jpeg,image/jpg,image/png,image/webp"
										onChange={handleLogoFileChange}
										className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
									/>
									<p className="text-xs text-gray-500">
										Podporované formáty: JPEG, PNG, WebP (max 2MB)
									</p>

									{/* Upload button for new logo */}
									{logoFile && selectedTeam && (
										<Button
											color="primary"
											onPress={() => handleLogoUpload(selectedTeam.id)}
											isLoading={logoUploading}
											className="w-full"
										>
											{logoUploading ? 'Nahrávání...' : 'Nahrát nové logo'}
										</Button>
									)}
								</div>
							</div>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color="danger" variant="flat" onPress={handleCloseEditTeam}>
							Zrušit
						</Button>
						<Button color="primary" onPress={handleUpdateTeam}>
							Uložit změny
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			{/* View Team Modal */}
			<Modal isOpen={isViewTeamOpen} onClose={onViewTeamClose} size="4xl">
				<ModalContent>
					<ModalHeader>Detail týmu - {selectedTeam?.name}</ModalHeader>
					<ModalBody>
						{selectedTeam && (
							<div className="space-y-6">
								{/* Tabs */}
								<div className="flex border-b border-gray-200 dark:border-gray-700">
									<button
										className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
											activeTab === 'details'
												? 'border-blue-500 text-blue-600'
												: 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
										}`}
										onClick={() => setActiveTab('details')}
									>
										Detaily
									</button>
									<button
										className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
											activeTab === 'categories'
												? 'border-blue-500 text-blue-600'
												: 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
										}`}
										onClick={() => setActiveTab('categories')}
									>
										Kategorie
									</button>
								</div>

								{/* Details Tab */}
								{activeTab === 'details' && (
									<div className="space-y-6">
										<div className="text-center">
											{selectedTeam.logo_url ? (
												<img
													src={selectedTeam.logo_url}
													alt={`${selectedTeam.name} logo`}
													className="w-16 h-16 object-contain mx-auto mb-4"
													onError={(e) => {
														// Fallback to icon if image fails to load
														e.currentTarget.style.display = 'none';
														e.currentTarget.nextElementSibling?.classList.remove('hidden');
													}}
												/>
											) : null}
											<BuildingOfficeIcon
												className={`w-16 h-16 text-blue-600 mx-auto mb-4 ${selectedTeam.logo_url ? 'hidden' : ''}`}
											/>
											<h3 className="text-2xl font-bold">{selectedTeam.name}</h3>
											{selectedTeam.short_name && (
												<p className="text-lg text-gray-600 dark:text-gray-400">
													{selectedTeam.short_name}
												</p>
											)}
											{getStatusBadge(selectedTeam.is_active)}
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div className="space-y-4">
												<h4 className="font-semibold text-lg">Základní informace</h4>
												<div className="space-y-3">
													{selectedTeam.city && (
														<div className="flex items-center gap-2">
															<MapPinIcon className="w-4 h-4 text-gray-500"/>
															<span>{selectedTeam.city}</span>
															{selectedTeam.committee?.name && <span
                                                                className="text-gray-500">({selectedTeam.committee.name})</span>}
														</div>
													)}
													{selectedTeam.home_venue && (
														<div className="flex items-center gap-2">
															<HomeIcon className="w-4 h-4 text-gray-500"/>
															<span>{selectedTeam.home_venue}</span>
														</div>
													)}
													{selectedTeam.founded_year && (
														<div className="flex items-center gap-2">
															<CalendarIcon className="w-4 h-4 text-gray-500"/>
															<span>Založen {selectedTeam.founded_year}</span>
														</div>
													)}
												</div>
											</div>

											<div className="space-y-4">
												<h4 className="font-semibold text-lg">Kontakt</h4>
												<div className="space-y-3">
													{selectedTeam.contact_person && (
														<div className="flex items-center gap-2">
															<UserIcon className="w-4 h-4 text-gray-500"/>
															<span>{selectedTeam.contact_person}</span>
														</div>
													)}
													{selectedTeam.email && (
														<div className="flex items-center gap-2">
															<EnvelopeIcon className="w-4 h-4 text-gray-500"/>
															<span>{selectedTeam.email}</span>
														</div>
													)}
													{selectedTeam.phone && (
														<div className="flex items-center gap-2">
															<PhoneIcon className="w-4 h-4 text-gray-500"/>
															<span>{selectedTeam.phone}</span>
														</div>
													)}
													{selectedTeam.website && (
														<div className="flex items-center gap-2">
															<GlobeAltIcon className="w-4 h-4 text-gray-500"/>
															<a href={selectedTeam.website} target="_blank"
															   rel="noopener noreferrer"
															   className="text-blue-600 hover:underline">
																{selectedTeam.website}
															</a>
														</div>
													)}
												</div>
											</div>
										</div>
									</div>
								)}

								{/* Categories Tab */}
								{activeTab === 'categories' && (
									<div className="space-y-6">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-4">
												<h4 className="font-semibold text-lg">Kategorie týmu</h4>
												<select
													className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
													value={selectedSeason}
													onChange={(e) => {
														setSelectedSeason(e.target.value);
														setCategoryFormData(prev => ({
															...prev,
															season_id: e.target.value
														}));
													}}
												>
													{seasons.map((season) => (
														<option key={season.id} value={season.id}>
															{season.name} {season.is_active && '(Aktivní)'}
														</option>
													))}
												</select>
											</div>
											<div className="flex gap-2">
												<Button
													color="secondary"
													size="sm"
													startContent={<UserGroupIcon className="w-4 h-4"/>}
													onPress={handleAddAllCategories}
												>
													Přidat všechny
												</Button>
												<Button
													color="primary"
													size="sm"
													startContent={<PlusIcon className="w-4 h-4"/>}
													onPress={handleAddTeamCategory}
												>
													Přidat kategorii
												</Button>
											</div>
										</div>

										{/* Add Category Form */}
										<div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
											<h5 className="font-medium mb-3">Přidat novou kategorii</h5>
											<div className="grid grid-cols-3 gap-4">
												<select
													className="p-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
													value={categoryFormData.category_id}
													onChange={(e) => setCategoryFormData({
														...categoryFormData,
														category_id: e.target.value
													})}
												>
													<option value="">Vyberte kategorii</option>
													{categories.map((category) => (
														<option key={category.id}
																value={category.id}>{category.name}</option>
													))}
												</select>

												<label className="flex items-center">
													<input
														type="checkbox"
														className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
														checked={categoryFormData.is_active}
														onChange={(e) => setCategoryFormData({
															...categoryFormData,
															is_active: e.target.checked
														})}
													/>
													<span
														className="ml-2 text-sm text-gray-700 dark:text-gray-300">Aktivní</span>
												</label>
											</div>
										</div>

										{/* Categories List */}
										<div className="space-y-3">
											<h5 className="font-medium">Přiřazené kategorie</h5>
											{teamCategories.length === 0 ? (
												<p className="text-gray-500 text-center py-4">Žádné kategorie nebyly
													přiřazeny</p>
											) : (
												<div className="overflow-x-auto">
													<table className="w-full">
														<thead>
														<tr className="border-b border-gray-200 dark:border-gray-700">
															<th className="text-left py-2 px-3">Kategorie</th>
															<th className="text-left py-2 px-3">Status</th>
															<th className="text-center py-2 px-3">Akce</th>
														</tr>
														</thead>
														<tbody>
														{teamCategories.map((teamCategory) => (
															<tr key={teamCategory.id}
																className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
																<td className="py-2 px-3">
																	<Badge
																		color={getCategoryBadgeColor(teamCategory.category?.code || '')}
																		variant="flat"
																	>
																		{teamCategory.category?.name || 'Neznámá kategorie'}
																	</Badge>
																</td>
																<td className="py-2 px-3">
																	<Badge
																		color={teamCategory.is_active ? 'success' : 'default'}
																		variant="flat"
																	>
																		{teamCategory.is_active ? (
																			<>
																				<CheckIcon className="w-3 h-3 mr-1"/>
																				Aktivní
																			</>
																		) : (
																			<>
																				<XMarkIcon className="w-3 h-3 mr-1"/>
																				Neaktivní
																			</>
																		)}
																	</Badge>
																</td>
																<td className="py-2 px-3">
																	<div className="flex justify-center">
																		<Button
																			size="sm"
																			color="danger"
																			variant="light"
																			startContent={<TrashIcon
																				className="w-4 h-4"/>}
																			onPress={() => handleDeleteTeamCategory(teamCategory.id)}
																		>
																			Smazat
																		</Button>
																	</div>
																</td>
															</tr>
														))}
														</tbody>
													</table>
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						)}
					</ModalBody>
					<ModalFooter>
						<Button color="primary" onPress={onViewTeamClose}>
							Zavřít
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</div>
	);
}

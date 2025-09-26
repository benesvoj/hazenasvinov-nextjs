'use client';

import React, {useState, useEffect} from 'react';
import {useCategoryLineups, useCategories} from '@/hooks';
import {useSeasons} from '@/hooks/entities/season/useSeasons';
import {useUserRoles} from '@/hooks/entities/user/useUserRoles';
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Tabs,
  Tab,
  Chip,
  Skeleton,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import {
  CategoryLineupFormData,
  AddMemberToLineupData,
} from '@/types/entities/category/data/categoryLineup';
import AddMemberModal from './components/AddMemberModal';
import {PageContainer} from '@/components';

export default function CoachesLineupsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedLineup, setSelectedLineup] = useState<string>('');
  const [isLineupModalOpen, setIsLineupModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [editingLineup, setEditingLineup] = useState<any>(null);
  const [lineupFormData, setLineupFormData] = useState<CategoryLineupFormData>({
    name: '',
    description: '',
    category_id: '',
    season_id: '',
  });

  const {
    lineups,
    lineupMembers,
    loading,
    error,
    fetchLineups,
    fetchLineupMembers,
    createLineup,
    updateLineup,
    deleteLineup,
    addMemberToLineup,
    removeMemberFromLineup,
    updateLineupMember,
  } = useCategoryLineups();

  const {seasons, loading: seasonsLoading, fetchAllSeasons} = useSeasons();
  const {categories, loading: categoriesLoading, fetchCategories} = useCategories();
  const {getCurrentUserCategories} = useUserRoles();

  // Get user's assigned category
  const [userCategories, setUserCategories] = useState<string[]>([]);

  // Fetch initial data
  useEffect(() => {
    fetchAllSeasons();
    fetchCategories();
  }, [fetchAllSeasons, fetchCategories]);

  useEffect(() => {
    const fetchUserCategories = async () => {
      try {
        const categories = await getCurrentUserCategories();
        setUserCategories(categories);
        if (categories.length > 0 && !selectedCategory) {
          setSelectedCategory(categories[0]);
        }
      } catch (err) {
        console.error('Error fetching user category:', err);
      }
    };

    fetchUserCategories();
  }, [getCurrentUserCategories, selectedCategory]);

  // Get active season
  const activeSeason = seasons.find((season) => season.is_active);

  useEffect(() => {
    if (activeSeason && !selectedSeason) {
      setSelectedSeason(activeSeason.id);
    }
  }, [activeSeason, selectedSeason]);

  // Fetch lineups when category and season change
  useEffect(() => {
    if (selectedCategory && selectedSeason) {
      fetchLineups(selectedCategory, selectedSeason);
    }
  }, [selectedCategory, selectedSeason, fetchLineups]);

  // Fetch lineup members when lineup changes
  useEffect(() => {
    if (selectedLineup) {
      fetchLineupMembers(selectedLineup);
    }
  }, [selectedLineup, fetchLineupMembers]);

  const handleCreateLineup = async () => {
    try {
      const lineupData = {
        ...lineupFormData,
        category_id: selectedCategory,
        season_id: selectedSeason,
      };

      await createLineup(lineupData);
      setIsLineupModalOpen(false);
      setLineupFormData({
        name: '',
        description: '',
        category_id: selectedCategory,
        season_id: selectedSeason,
      });
    } catch (err) {
      console.error('Error creating lineup:', err);
    }
  };

  const handleUpdateLineup = async () => {
    if (!editingLineup) return;

    try {
      const lineupData = {
        ...lineupFormData,
        category_id: selectedCategory,
        season_id: selectedSeason,
      };

      await updateLineup(editingLineup.id, lineupData);
      setIsLineupModalOpen(false);
      setEditingLineup(null);
      setLineupFormData({
        name: '',
        description: '',
        category_id: selectedCategory,
        season_id: selectedSeason,
      });
    } catch (err) {
      console.error('Error updating lineup:', err);
    }
  };

  const handleEditLineup = (lineup: any) => {
    setEditingLineup(lineup);
    setLineupFormData({
      name: lineup.name,
      description: lineup.description || '',
      category_id: lineup.category_id,
      season_id: lineup.season_id,
    });
    setIsLineupModalOpen(true);
  };

  const handleDeleteLineup = async (lineupId: string) => {
    if (confirm('Opravdu chcete smazat tento soupisku?')) {
      try {
        await deleteLineup(lineupId);
        if (selectedLineup === lineupId) {
          setSelectedLineup('');
        }
      } catch (err) {
        console.error('Error deleting lineup:', err);
      }
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Opravdu chcete odebrat tohoto člena ze soupisky?')) {
      try {
        await removeMemberFromLineup(memberId);
      } catch (err) {
        console.error('Error removing member:', err);
      }
    }
  };

  const handleAddMember = async (memberData: AddMemberToLineupData) => {
    if (!selectedLineup) {
      throw new Error('Není vybrána žádná soupiska. Prosím vyberte soupisku před přidáním člena.');
    }

    try {
      await addMemberToLineup(selectedLineup, memberData);
    } catch (err) {
      console.error('Error adding member:', err);
      throw err; // Re-throw to show error in modal
    }
  };

  const handleEditMember = (member: any) => {
    // For now, just show an alert. In the future, this could open an edit modal
    alert(
      `Edit functionality for ${member.member?.name} ${member.member?.surname} will be implemented in the next step.`
    );
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'goalkeeper':
        return 'primary';
      case 'field_player':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPositionText = (position: string) => {
    switch (position) {
      case 'goalkeeper':
        return 'Brankář';
      case 'field_player':
        return 'Hráč v poli';
      default:
        return position;
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
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
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
                  return <Tab key={categoryId} title={category?.name || categoryId} />;
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
                  startContent={<PlusIcon className="w-4 h-4" />}
                  onPress={() => {
                    setEditingLineup(null);
                    setLineupFormData({
                      name: '',
                      description: '',
                      category_id: selectedCategory,
                      season_id: selectedSeason,
                    });
                    setIsLineupModalOpen(true);
                  }}
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
                    <Skeleton key={i} className="h-16 rounded-lg" />
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
                            startContent={<PencilIcon className="w-4 h-4" />}
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
                            startContent={<TrashIcon className="w-4 h-4" />}
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
                <h3 className="text-lg font-semibold">
                  Členové soupisky {selectedLineup ? `(${lineupMembers.length})` : ''}
                </h3>
                {selectedLineup && (
                  <Button
                    size="sm"
                    color="primary"
                    startContent={<UserPlusIcon className="w-4 h-4" />}
                    onPress={() => setIsAddMemberModalOpen(true)}
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
                    <Skeleton key={i} className="h-12 rounded-lg" />
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
                                {member.member?.surname} {member.member?.name}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500">
                                {member.member?.registration_number}
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
                                  <Chip size="sm" color="warning" className="text-xs">
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
                                aria-label={`Upravit ${member.member?.name} ${member.member?.surname}`}
                                startContent={<PencilIcon className="w-4 h-4" />}
                              />
                              <Button
                                size="sm"
                                color="danger"
                                variant="light"
                                onPress={() => handleRemoveMember(member.id)}
                                isIconOnly
                                aria-label={`Odebrat ${member.member?.name} ${member.member?.surname}`}
                                startContent={<TrashIcon className="w-4 h-4" />}
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

      {/* Lineup Modal */}
      <Modal isOpen={isLineupModalOpen} onClose={() => setIsLineupModalOpen(false)} size="2xl">
        <ModalContent>
          <ModalHeader>{editingLineup ? 'Upravit soupisku' : 'Nová soupiska'}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Název soupisky"
                placeholder="Zadejte název soupisky"
                value={lineupFormData.name}
                onChange={(e) => setLineupFormData((prev) => ({...prev, name: e.target.value}))}
                isRequired
              />

              <Textarea
                label="Popis"
                placeholder="Zadejte popis soupisky"
                value={lineupFormData.description}
                onChange={(e) =>
                  setLineupFormData((prev) => ({...prev, description: e.target.value}))
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsLineupModalOpen(false)}>
              Zrušit
            </Button>
            <Button
              color="primary"
              onPress={editingLineup ? handleUpdateLineup : handleCreateLineup}
              isDisabled={!lineupFormData.name}
            >
              {editingLineup ? 'Uložit změny' : 'Vytvořit soupisku'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onAddMember={handleAddMember}
        selectedCategoryName={categories.find((c) => c.id === selectedCategory)?.name || ''}
        selectedCategoryId={categories.find((c) => c.id === selectedCategory)?.id || ''}
        existingMembers={existingMemberIds}
        existingJerseyNumbers={existingJerseyNumbers}
      />
    </PageContainer>
  );
}

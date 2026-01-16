// TODO: refactor needed
'use client';

import React, {useEffect, useState} from 'react';

import {Card, CardBody, Spinner, Tab, Tabs} from '@heroui/react';

import {useUserRoles} from '@/hooks/entities/user/useUserRoles';

import {LineupMembers, LineupModal, LineupsList} from '@/app/coaches/lineups/components';

import {DeleteConfirmationModal, PageContainer} from '@/components';
import {useUser} from '@/contexts';
import {ModalMode} from '@/enums';
import {
  useCategoryLineupForm,
  useCategoryLineupMember,
  useCategoryLineups,
  useCustomModal,
  useFetchCategories,
  useFetchCategoryLineups,
  useFetchSeasons,
} from '@/hooks';
import {translations} from '@/lib';
import {CategoryLineup} from '@/types';

const t = translations.coachPortal.lineupList;

export default function CoachesLineupsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedLineup, setSelectedLineup] = useState<CategoryLineup | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [deleteOption, setDeleteOption] = useState<'lineup' | 'member' | null>(null);

  const {
    data: lineups,
    loading: loadingLineups,
    refetch,
  } = useFetchCategoryLineups({categoryId: selectedCategory, seasonId: selectedSeason});

  const {loading: crudLoading, createLineup, updateLineup, deleteLineup} = useCategoryLineups();
  const {removeLineupMember} = useCategoryLineupMember();
  const {data: categories} = useFetchCategories();
  const {
    formData,
    setFormData,
    selectedItem: selectedLineupId,
    modalMode,
    openAddMode,
    openEditMode,
    validateForm,
    resetForm,
  } = useCategoryLineupForm();

  const {data: seasons, refetch: fetchAllSeasons} = useFetchSeasons();

  const {getCurrentUserCategories} = useUserRoles();
  const {user} = useUser();

  // Get user's assigned category
  const [userCategories, setUserCategories] = useState<string[]>([]);

  const {
    isOpen: isLineupModalOpen,
    onOpen: onLineupModalOpen,
    onClose: onLineupModalClose,
  } = useCustomModal();

  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useCustomModal();

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
  }, [getCurrentUserCategories, selectedCategory]);

  // Get active season
  const activeSeason = seasons.find((season) => season.is_active);

  useEffect(() => {
    if (activeSeason && !selectedSeason) {
      setSelectedSeason(activeSeason.id);
    }
  }, [activeSeason, selectedSeason]);

  const handleAddLineup = () => {
    openAddMode();
    onLineupModalOpen();
  };

  const handleEditLineup = (lineup: CategoryLineup) => {
    openEditMode(lineup);
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
    setDeleteOption('lineup');
    setItemToDelete(lineupId);
    onDeleteModalOpen();
  };

  const handleConfirmDelete = async () => {
    if (deleteOption === 'lineup' && itemToDelete) {
      try {
        await deleteLineup(itemToDelete);
        await refetch();
        onDeleteModalClose();
        setItemToDelete(null);
        setDeleteOption(null);
        resetForm();
      } catch (err) {
        console.error('Error deleting lineup:', err);
      }
    } else {
      if (deleteOption === 'member' && selectedCategory && selectedLineup && itemToDelete) {
        try {
          await removeLineupMember(selectedCategory, selectedLineup.id, itemToDelete);
          await refetch();
          onDeleteModalClose();
          setItemToDelete(null);
          setDeleteOption(null);
          resetForm();
        } catch (err) {
          console.error('Error deleting member:', err);
        }
      }
    }
  };

  if (loadingLineups && !lineups.length) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  const handleSubmitLineup = async () => {
    const {valid, errors} = validateForm();

    if (!valid) {
      console.error('Validation errors:', errors);
      return;
    }

    try {
      if (modalMode === ModalMode.EDIT && selectedLineupId) {
        await updateLineup(selectedLineupId.id, formData);
      } else {
        const dataToCreate = {
          ...formData,
          category_id: selectedCategory,
          season_id: selectedSeason,
          created_by: user?.id || '',
        };
        await createLineup(dataToCreate);
      }
      await refetch();
      onLineupModalClose();
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const isDeleteOptionLineup = deleteOption === 'lineup';

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
                    return <Tab key={categoryId} title={category?.name || categoryId} />;
                  })}
                </Tabs>
              </div>
            </CardBody>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <LineupsList
            selectedCategory={selectedCategory}
            selectedSeason={selectedSeason}
            selectedLineupId={selectedLineup?.id ? selectedLineup.id : ''}
            setSelectedLineup={setSelectedLineup}
            loading={loadingLineups}
            lineupsList={lineups}
            onAddLineup={handleAddLineup}
            onEditLineup={handleEditLineup}
            onDeleteLineup={handleDeleteLineup}
          />

          <LineupMembers lineupId={selectedLineup?.id || ''} categoryId={selectedCategory} />
        </div>
      </PageContainer>

      {/* Lineup Modal */}
      <LineupModal
        isOpen={isLineupModalOpen}
        onClose={onLineupModalClose}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmitLineup}
        mode={modalMode}
        isLoading={crudLoading}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        onConfirm={handleConfirmDelete}
        title={isDeleteOptionLineup ? t.deleteLineup : t.deleteLineupMember}
        message={isDeleteOptionLineup ? t.deleteLineupMessage : t.deleteLineupMemberMessage}
      />
    </>
  );
}

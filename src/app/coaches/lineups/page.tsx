// TODO: refactor needed
'use client';

import React, {useEffect, useState} from 'react';

import {Card, CardBody, Spinner, Tab, Tabs} from '@heroui/react';

import {useUserRoles} from '@/hooks/entities/user/useUserRoles';
import {useModalWithItem} from '@/hooks/shared/useModals';

import {LineupMembers, LineupModal, LineupsList} from '@/app/coaches/lineups/components';

import {DeleteConfirmationModal, PageContainer} from '@/components';
import {useUser} from '@/contexts';
import {ModalMode} from '@/enums';
import {
  useCategoryLineupForm,
  useCategoryLineupMember,
  useCategoryLineups,
  useFetchCategories,
  useFetchCategoryLineups,
  useFetchSeasons,
} from '@/hooks';
import {translations} from '@/lib';
import {CategoryLineup} from '@/types';

interface DeleteItem {
  type: 'lineup' | 'member';
  id: string;
}

const t = translations.coachPortal.lineupList;

export default function CoachesLineupsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedLineup, setSelectedLineup] = useState<CategoryLineup | null>(null);

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
    validateForm,
    resetForm,
  } = useCategoryLineupForm();

  const {data: seasons, refetch: fetchAllSeasons} = useFetchSeasons();

  const {getCurrentUserCategories} = useUserRoles();
  const {user} = useUser();

  // Get user's assigned category
  const [userCategories, setUserCategories] = useState<string[]>([]);

  const lineupModal = useModalWithItem<CategoryLineup>();
  const deleteModal = useModalWithItem<DeleteItem>();

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedSeason(activeSeason.id);
    }
  }, [activeSeason, selectedSeason]);

  const handleAddLineup = () => {
    openAddMode();
    lineupModal.onOpen();
  };

  const handleEditLineup = (lineup: CategoryLineup) => {
    lineupModal.openWith(lineup);

    setFormData({
      name: lineup.name,
      description: lineup.description || '',
      category_id: lineup.category_id,
      season_id: lineup.season_id,
      created_by: lineup.created_by,
      is_active: lineup.is_active,
    });
  };

  const handleDeleteLineup = (lineupId: string) => {
    deleteModal.openWith({type: 'lineup', id: lineupId});
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.selectedItem) return;

    const {type, id} = deleteModal.selectedItem;

    try {
      if (type === 'lineup') {
        await deleteLineup(id);
      } else if (type === 'member' && selectedCategory && selectedLineup) {
        await removeLineupMember(selectedCategory, selectedLineup.id, id);
      }
      await refetch();
      deleteModal.closeAndClear();
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
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
      lineupModal.closeAndClear();
    } catch (error) {
      console.error(error);
    }
  };

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
        isOpen={lineupModal.isOpen}
        onClose={lineupModal.closeAndClear}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmitLineup}
        mode={modalMode}
        isLoading={crudLoading}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeAndClear}
        onConfirm={handleConfirmDelete}
        title={deleteModal.selectedItem?.type === 'lineup' ? t.deleteLineup : t.deleteLineupMember}
        message={
          deleteModal.selectedItem?.type === 'lineup'
            ? t.deleteLineupMessage
            : t.deleteLineupMemberMessage
        }
      />
    </>
  );
}

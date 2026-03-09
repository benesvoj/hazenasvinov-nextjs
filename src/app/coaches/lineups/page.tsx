// TODO: refactor needed
'use client';

import React, {useEffect, useState} from 'react';

import {useUserRoles} from '@/hooks/entities/user/useUserRoles';
import {useModalWithItem} from '@/hooks/shared/useModals';

import {translations} from '@/lib/translations';

import {useCoachCategory} from '@/app/coaches/components/CoachCategoryContext';
import {LineupMembers, LineupModal, LineupsList} from '@/app/coaches/lineups/components';

import {Choice, ContentCard, DeleteDialog, Grid, GridItem, PageContainer, Show} from '@/components';
import {useUser} from '@/contexts';
import {ModalMode} from '@/enums';
import {
  useCategoryLineupForm,
  useCategoryLineupMember,
  useCategoryLineups,
  useFetchCategoryLineups,
  useFetchSeasons,
} from '@/hooks';
import {CategoryLineup} from '@/types';
import {hasMoreThanOne} from '@/utils';

interface DeleteItem {
  type: 'lineup' | 'member';
  id: string;
}

const t = translations.lineups;

export default function CoachesLineupsPage() {
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedLineup, setSelectedLineup] = useState<CategoryLineup | null>(null);

  const {selectedCategory, setSelectedCategory, availableCategories} = useCoachCategory();

  const {
    data: lineups,
    loading: loadingLineups,
    refetch,
  } = useFetchCategoryLineups({categoryId: selectedCategory, seasonId: selectedSeason});

  const {loading: crudLoading, createLineup, updateLineup, deleteLineup} = useCategoryLineups();
  const {removeLineupMember} = useCategoryLineupMember();
  const {
    formData,
    setFormData,
    selectedItem: selectedLineupId,
    modalMode,
    openAddMode,
    validateForm,
  } = useCategoryLineupForm();

  const {data: seasons, refetch: fetchAllSeasons} = useFetchSeasons();

  const {getCurrentUserCategories} = useUserRoles();
  const {user} = useUser();

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
      <PageContainer isLoading={loadingLineups}>
        <Show when={hasMoreThanOne(userCategories)}>
          <ContentCard padding={'none'}>
            <Choice
              value={selectedCategory}
              onChange={(id) => setSelectedCategory(id)}
              items={availableCategories.map((c) => ({key: c.id, label: c.name}))}
              label={translations.members.table.columns.category}
              size="sm"
              className={'md:w-1/4'}
              disallowEmptySelection={true}
            />
          </ContentCard>
        </Show>

        <Grid columns={3}>
          <GridItem span={1}>
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
          </GridItem>
          <GridItem span={2}>
            <LineupMembers lineupId={selectedLineup?.id || ''} categoryId={selectedCategory} />
          </GridItem>
        </Grid>
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

      <DeleteDialog
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeAndClear}
        onSubmit={handleConfirmDelete}
        title={deleteModal.selectedItem?.type === 'lineup' ? t.titles.delete : t.deleteLineupMember}
        message={
          deleteModal.selectedItem?.type === 'lineup'
            ? t.deleteLineupMessage
            : t.deleteLineupMemberMessage
        }
        isLoading={crudLoading}
      />
    </>
  );
}

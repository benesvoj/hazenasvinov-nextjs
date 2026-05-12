'use client';

import {useState} from 'react';

import {useUser} from '@/contexts';
import {ModalMode} from '@/enums';
import {useCoachCategory} from '@/features/coach/providers/CategoryProvider';
import {
  useCategoryLineupForm,
  useCategoryLineups,
  useFetchCategoryLineups,
  useModalWithItem,
} from '@/hooks';
import {CategoryLineup} from '@/types';

export function useCoachLineupsPageLogic() {
  const [selectedLineup, setSelectedLineup] = useState<CategoryLineup | null>(null);

  const {selectedCategory, setSelectedCategory, availableCategories, selectedSeason} =
    useCoachCategory();
  const {user} = useUser();

  const {
    data: lineups,
    loading: loadingLineups,
    refetch,
  } = useFetchCategoryLineups({categoryId: selectedCategory, seasonId: selectedSeason});

  const {loading: crudLoading, createLineup, updateLineup, deleteLineup} = useCategoryLineups();

  const {
    formData,
    setFormData,
    selectedItem: selectedLineupId,
    modalMode,
    openAddMode,
    openEditMode,
    validateForm,
  } = useCategoryLineupForm();

  const lineupModal = useModalWithItem<CategoryLineup>();
  const deleteModal = useModalWithItem<string>();

  const handleAddLineup = () => {
    openAddMode();
    lineupModal.onOpen();
  };

  const handleEditLineup = (lineup: CategoryLineup) => {
    openEditMode(lineup);
    lineupModal.onOpen();
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
    deleteModal.openWith(lineupId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.selectedItem) return;
    try {
      await deleteLineup(deleteModal.selectedItem);
      await refetch();
      deleteModal.closeAndClear();
    } catch (err) {
      console.error('Error deleting lineup:', err);
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
        await createLineup({
          ...formData,
          category_id: selectedCategory,
          season_id: selectedSeason,
          created_by: user?.id || '',
        });
      }
      await refetch();
      lineupModal.closeAndClear();
    } catch (error) {
      console.error(error);
    }
  };

  return {
    // Category / season
    selectedCategory,
    setSelectedCategory,
    availableCategories,
    selectedSeason,

    // Lineups data
    lineups,
    loadingLineups,

    // Selection (members panel)
    selectedLineup,
    setSelectedLineup,

    // Modal state
    lineupModal,
    deleteModal,
    formData,
    setFormData,
    modalMode,
    crudLoading,

    // Handlers
    handleAddLineup,
    handleEditLineup,
    handleDeleteLineup,
    handleConfirmDelete,
    handleSubmitLineup,
  };
}

'use client';

import {useCallback, useState} from 'react';

import {ModalMode} from '@/enums';
import {ClubCategoryInsert, ClubCategorySchema} from '@/types';

const initialFormData: ClubCategoryInsert = {
  club_id: '',
  category_id: '',
  season_id: '',
  max_teams: 1,
  id: '',
  is_active: true,
};

/**
 * Hook for managing club category form state
 * Handles: form data, validation, reset
 */
export const useClubCategoryForm = () => {
  const [formData, setFormData] = useState<ClubCategoryInsert>(initialFormData);
  const [selectedClubCategory, setSelectedClubCategory] = useState<ClubCategorySchema | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.ADD);

  const openAddMode = useCallback(() => {
    setModalMode(ModalMode.ADD);
    setSelectedClubCategory(null);
    setFormData(initialFormData);
  }, []);

  const openEditMode = useCallback((item: ClubCategorySchema) => {
    setModalMode(ModalMode.EDIT);
    setSelectedClubCategory(item);
    const {id, created_at, ...editableFields} = item;
    setFormData(editableFields);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setSelectedClubCategory(null);
    setModalMode(ModalMode.ADD);
  }, []);

  return {
    formData,
    setFormData,
    selectedClubCategory,
    modalMode,
    openAddMode,
    openEditMode,
    resetForm,
  };
};

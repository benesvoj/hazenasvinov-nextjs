'use client';

import {useCallback, useState} from 'react';

import {ModalMode} from '@/enums';
import {Category, CategoryFormData} from '@/types';

const initialFormData: CategoryFormData = {
  name: '',
  description: '',
  age_group: '',
  gender: '',
  is_active: true,
  sort_order: 0,
  slug: '',
};

/**
 * Hook for managing category form state
 * Handles: form data, validation, reset
 */
export function useCategoryForm() {
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.ADD);

  const openAddMode = useCallback(() => {
    setModalMode(ModalMode.ADD);
    setSelectedCategory(null);
    setFormData(initialFormData);
  }, []);

  const openEditMode = useCallback((category: Category) => {
    setModalMode(ModalMode.EDIT);
    setSelectedCategory(category);
    const {id, created_at, updated_at, ...editableFields} = category;
    setFormData(editableFields);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setSelectedCategory(null);
    setModalMode(ModalMode.ADD);
  }, []);

  const validateForm = useCallback((): {valid: boolean; errors: string[]} => {
    const errors: string[] = [];

    if (!formData.name?.trim()) {
      errors.push('name is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }, [formData]);

  return {
    // State
    formData,
    selectedCategory,
    modalMode,
    //Actions
    setFormData,
    openAddMode,
    openEditMode,
    resetForm,
    validateForm,
  };
}

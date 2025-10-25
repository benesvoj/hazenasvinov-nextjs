'use client';

import {useCallback, useState} from 'react';

import {ModalMode} from '@/enums';
import {MemberFunction, MemberFunctionFormData} from '@/types';

const initialFormData: MemberFunctionFormData = {
  name: '',
  display_name: '',
  description: '',
  sort_order: 0,
  is_active: true,
};

export function useMemberFunctionForm() {
  const [formData, setFormData] = useState<MemberFunctionFormData>(initialFormData);
  const [selectedRecord, setSelectedRecord] = useState<MemberFunction | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.ADD);

  const openAddMode = useCallback(() => {
    setModalMode(ModalMode.ADD);
    setSelectedRecord(null);
    setFormData(initialFormData);
  }, []);

  const openEditMode = useCallback((item: MemberFunction) => {
    setModalMode(ModalMode.EDIT);
    setSelectedRecord(item);
    const {id, created_at, updated_at, ...editableFields} = item;
    setFormData(editableFields);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setSelectedRecord(null);
    setModalMode(ModalMode.ADD);
  }, []);

  const validateForm = useCallback((): {valid: boolean; errors: string[]} => {
    const errors: string[] = [];

    if (!formData.name?.trim()) {
      errors.push('name is required');
    }
    if (!formData.display_name?.trim()) {
      errors.push('display_name is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }, [formData]);

  return {
    // State
    formData,
    selectedRecord,
    modalMode,

    // Actions
    openAddMode,
    openEditMode,
    resetForm,
    validateForm,

    // Setter
    setFormData,
  };
}

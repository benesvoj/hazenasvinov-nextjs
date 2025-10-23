'use client';
import {useCallback, useState} from 'react';

import {ModalMode} from '@/enums';
import {translations} from '@/lib';
import {Committee, CommitteeFormData} from '@/types';

const initialFormData: CommitteeFormData = {
  code: '',
  name: '',
  description: '',
  is_active: true,
  sort_order: 0,
};

/**
 * Hook for managing committee form state
 * Handles: form data, validation, reset
 */
export function useCommitteeForm() {
  const [formData, setFormData] = useState<CommitteeFormData>(initialFormData);
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.ADD);
  const t = translations.admin.committees.responseMessages;
  // Open form for adding new committee
  const openAddMode = useCallback(() => {
    setModalMode(ModalMode.ADD);
    setSelectedCommittee(null);
    setFormData(initialFormData);
  }, []);

  // Open form for editing existing committee
  const openEditMode = useCallback((committee: Committee) => {
    setModalMode(ModalMode.EDIT);
    setSelectedCommittee(committee);
    const {id, created_at, updated_at, ...editableFields} = committee;
    setFormData(editableFields);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setSelectedCommittee(null);
    setModalMode(ModalMode.ADD);
  }, []);

  const validateForm = useCallback((): {valid: boolean; errors: string[]} => {
    const errors: string[] = [];

    if (!formData.code?.trim()) {
      errors.push(t.mandatoryCode);
    }
    if (!formData.name?.trim()) {
      errors.push(t.mandatoryName);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }, [t, formData]);

  return {
    // State
    formData,
    selectedCommittee,
    modalMode,
    // Actions
    setFormData,
    openAddMode,
    openEditMode,
    resetForm,
    validateForm,
  };
}

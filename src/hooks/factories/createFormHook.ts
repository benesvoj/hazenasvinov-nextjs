'use client';

import {useCallback, useState} from 'react';

import {showToast} from '@/components';
import {ModalMode} from '@/enums';

export interface ValidationRule<T> {
  field: keyof T;
  message: string;
  /**Optional custom validator function */
  validator?: (value: any) => boolean;
}

export interface FormHookConfig<TEntity, TFormData> {
  /** Initial form data */
  initialFormData: TFormData;
  /** Validation rules for the form */
  validationRules: ValidationRule<TFormData>[];
  /** Fields to exclude when editing (default: ['id', 'created_at', 'updated_at', 'created_by']) */
  excludeFields?: string[];
}

export interface FormHookResult<TEntity, TFormData> {
  // State
  formData: TFormData;
  selectedItem: TEntity | null;
  modalMode: ModalMode;

  // Actions
  setFormData: (data: TFormData) => void;
  updateFormData: (updates: Partial<TFormData>) => void;
  openAddMode: () => void;
  openEditMode: (item: TEntity) => void;
  resetForm: () => void;
  validateForm: () => {valid: boolean; errors: string[]};
}

/**
 * Factory function to create form management hooks
 *
 * @example
 * const useGrantForm = createFormHook<Grant, GrantFormData>({
 *   initialFormData: {name: '', month: 1, ...},
 *   validationRules: [
 *     {field: 'name', message: 'Name is required'},
 *     {field: 'month', message: 'Month is required'}
 *   ]
 * });
 */
export function createFormHook<TEntity, TFormData>(
  config: FormHookConfig<TEntity, TFormData>
): () => FormHookResult<TEntity, TFormData> {
  const {
    initialFormData,
    validationRules,
    excludeFields = ['id', 'created_at', 'updated_at', 'created_by'],
  } = config;
  return function useForm(): FormHookResult<TEntity, TFormData> {
    const [formData, setFormData] = useState<TFormData>(initialFormData);
    const [selectedItem, setSelectedItem] = useState<TEntity | null>(null);
    const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.ADD);

    const openAddMode = useCallback(() => {
      setModalMode(ModalMode.ADD);
      setSelectedItem(null);
      setFormData(initialFormData);
    }, []);

    const openEditMode = useCallback((item: TEntity) => {
      setModalMode(ModalMode.EDIT);
      setSelectedItem(item);

      const editableFields = Object.keys(item as any).reduce((acc, key) => {
        if (!excludeFields.includes(key)) {
          acc[key] = (item as any)[key];
        }
        return acc;
      }, {} as any);

      setFormData(editableFields as TFormData);
    }, []);

    const resetForm = useCallback(() => {
      setFormData(initialFormData);
      setSelectedItem(null);
      setModalMode(ModalMode.ADD);
    }, []);

    const validateForm = useCallback((): {valid: boolean; errors: string[]} => {
      const errors: string[] = [];

      validationRules.forEach((rule) => {
        const value = formData[rule.field];

        // Defautl validation: check if field is truthy and trimmed
        const isValid = rule.validator
          ? rule.validator(value)
          : typeof value === 'string'
            ? value.trim() !== ''
            : value !== null && value !== '';

        if (!isValid) {
          showToast.warning(rule.message);
          errors.push(rule.message);
        }
      });

      return {
        valid: errors.length === 0,
        errors,
      };
    }, [formData]);

    const updateFormData = useCallback((updates: Partial<TFormData>) => {
      setFormData((prev) => ({...prev, ...updates}));
    }, []);

    return {
      formData,
      selectedItem,
      modalMode,
      setFormData,
      openAddMode,
      openEditMode,
      resetForm,
      validateForm,
      updateFormData,
    };
  };
}

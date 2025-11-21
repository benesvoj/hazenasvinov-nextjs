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
 * Factory function to create form management hooks with validation and add/edit modes
 *
 * @architectural-layer State Management Layer
 * @see {@link https://github.com/anthropics/claude-code/blob/main/docs/architecture/LAYERED_ARCHITECTURE.md}
 * @see {@link https://github.com/anthropics/claude-code/blob/main/docs/architecture/FACTORY_PATTERNS.md}
 *
 * @description
 * Creates a custom hook that:
 * - Manages form state with React.useState
 * - Validates form fields with customizable rules
 * - Handles add/edit modes (ModalMode.ADD or ModalMode.EDIT)
 * - Auto-populates form data when switching to edit mode
 * - Excludes read-only fields (id, timestamps) from form
 * - Shows validation errors as toasts
 * - Provides reset functionality
 *
 * @template TEntity - The entity type (e.g., VideoSchema)
 * @template TFormData - The form data type (e.g., VideoFormData)
 *
 * @param config - Configuration for the form hook
 * @param config.initialFormData - Initial state for form fields
 * @param config.validationRules - Array of validation rules
 * @param config.excludeFields - Fields to exclude from edit mode (default: ['id', 'created_at', 'updated_at', 'created_by'])
 *
 * @returns A custom hook that manages form state and validation
 *
 * @example
 * // Define form hook
 * const useVideoForm = createFormHook<VideoSchema, VideoFormData>({
 *   initialFormData: {
 *     title: '',
 *     description: '',
 *     youtube_url: '',
 *     category_id: '',
 *     is_active: true,
 *   },
 *   validationRules: [
 *     {field: 'title', message: 'Title is required'},
 *     {field: 'youtube_url', message: 'YouTube URL is required'},
 *   ],
 * });
 *
 * // Use in component
 * function VideoFormModal() {
 *   const {
 *     formData,
 *     setFormData,
 *     modalMode,
 *     validateForm,
 *     openAddMode,
 *     openEditMode,
 *     resetForm
 *   } = useVideoForm();
 *
 *   const handleSubmit = () => {
 *     const {valid, errors} = validateForm();
 *     if (!valid) {
 *       console.error('Validation failed:', errors);
 *       return;
 *     }
 *     // Submit form data
 *   };
 *
 *   return (
 *     <Form>
 *       <Input
 *         value={formData.title}
 *         onChange={(e) => setFormData({...formData, title: e.target.value})}
 *       />
 *       <Button onClick={handleSubmit}>
 *         {modalMode === ModalMode.ADD ? 'Create' : 'Update'}
 *       </Button>
 *     </Form>
 *   );
 * }
 *
 * @example
 * // Custom validation
 * const useVideoForm = createFormHook<VideoSchema, VideoFormData>({
 *   initialFormData: {  ...  },
 *   validationRules: [
 *     {
 *       field: 'youtube_url',
 *       message: 'Invalid YouTube URL',
 *       validator: (url) => /youtube\.com|youtu\.be/.test(url)
 *     },
 *   ],
 * });
 *
 * @architectural-usage
 * ✅ Use when:
 * - Creating forms for entity create/edit
 * - Need validation with error messages
 * - Managing add/edit modal modes
 * - Want consistent form behavior across entities
 *
 * ❌ Don't use when:
 * - Form has very complex multi-step logic
 * - Need custom validation flow
 * - Form doesn't fit add/edit pattern
 *
 * @performance
 * - Uses useCallback for stable function references
 * - Memoizes validation to prevent unnecessary recalculations
 * - Efficient state updates with functional setState
 *
 * @validation
 * Default validation logic:
 * - String fields: checked with .trim() !== ''
 * - Other fields: checked with !== null && !== ''
 * - Custom validator: use the validator function if provided
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

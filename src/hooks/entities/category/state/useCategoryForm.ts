'use client';

import {translations} from '@/lib/translations';

import {createFormHook} from '@/hooks';
import {Category, CategoryFormData} from '@/types';

const t = translations.categories.responseMessages;
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
  return createFormHook<Category, CategoryFormData>({
    initialFormData,
    validationRules: [{field: 'name', message: t.mandatoryName}],
  })();
}

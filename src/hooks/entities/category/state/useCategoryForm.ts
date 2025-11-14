'use client';

import {createFormHook} from "@/hooks";
import {translations} from "@/lib";
import {Category, CategoryFormData} from '@/types';

const t = translations.admin.categories.responseMessages
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
export const useCategoryForm = createFormHook<Category, CategoryFormData>({
  initialFormData,
    validationRules: [
        {field: 'name', message: t.mandatoryName},
    ],
});
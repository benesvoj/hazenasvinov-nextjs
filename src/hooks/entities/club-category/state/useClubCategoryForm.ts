'use client';

import {createFormHook} from '@/hooks';
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
export function useClubCategoryForm() {
  return createFormHook<ClubCategorySchema, ClubCategoryInsert>({
    initialFormData,
    validationRules: [],
  })();
}

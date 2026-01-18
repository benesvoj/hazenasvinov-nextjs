'use client';

import {createFormHook} from '@/hooks';
import {translations} from '@/lib';
import {CategoryLineup, CategoryLineupFormData} from '@/types';

const t = translations.coachPortal.lineupList.responseMessages;

const initialFormData: CategoryLineupFormData = {
  name: '',
  description: '',
  category_id: '',
  season_id: '',
  is_active: true,
  created_by: '',
};

export function useCategoryLineupForm() {
  return createFormHook<CategoryLineup, CategoryLineupFormData>({
    initialFormData,
    validationRules: [{field: 'name', message: t.mandatoryName}],
  })();
}

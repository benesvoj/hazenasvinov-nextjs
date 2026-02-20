'use client';

import {translations} from '@/lib/translations/index';

import {createFormHook} from '@/hooks';
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
  return createFormHook<Committee, CommitteeFormData>({
    initialFormData,
    validationRules: [
      {field: 'code', message: translations.committees.responseMessages.mandatoryCode},
      {field: 'name', message: translations.committees.responseMessages.mandatoryName},
    ],
  })();
}

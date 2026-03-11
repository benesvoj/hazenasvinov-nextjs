'use client';

import {translations} from '@/lib/translations';

import {createFormHook} from '@/hooks';
import {Grant, GrantFormData} from '@/types';

const t = translations.grantCalendar.responseMessages;

const initialFormData: GrantFormData = {
  name: '',
  description: '',
  month: new Date().getMonth() + 1,
  is_active: false,
  created_by: null,
};

export function useGrantForm() {
  return createFormHook<Grant, GrantFormData>({
    initialFormData,
    validationRules: [
      {field: 'name', message: t.mandatoryName},
      {field: 'month', message: t.mandatoryMonth},
    ],
  })();
}

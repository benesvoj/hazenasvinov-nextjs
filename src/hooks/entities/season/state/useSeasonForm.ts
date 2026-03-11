'use client';

import {translations} from '@/lib/translations';

import {createFormHook} from '@/hooks';
import {Season, SeasonFormData} from '@/types';

const t = translations.seasons.responseMessages;
const initialFormData: SeasonFormData = {
  name: '',
  start_date: '',
  end_date: '',
  is_active: false,
  is_closed: false,
};

export function useSeasonForm() {
  return createFormHook<Season, SeasonFormData>({
    initialFormData,
    validationRules: [
      {field: 'name', message: t.mandatoryName},
      {field: 'start_date', message: t.mandatoryStartDate},
    ],
  })();
}

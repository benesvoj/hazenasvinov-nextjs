'use client';

import {translations} from '@/lib/translations/index';

import {createFormHook} from '@/hooks';
import {Club, ClubFormData} from '@/types';

const initialFormData: ClubFormData = {
  name: '',
  short_name: '',
  city: '',
  founded_year: null,
  logo_url: '',
  venue: '',
  web: '',
  email: '',
  phone: '',
  address: '',
  description: '',
  contact_person: '',
  is_own_club: false,
  is_active: true,
};

export function useClubForm() {
  return createFormHook<Club, ClubFormData>({
    initialFormData,
    validationRules: [{field: 'name', message: translations.clubs.responseMessages.mandatoryName}],
  })();
}

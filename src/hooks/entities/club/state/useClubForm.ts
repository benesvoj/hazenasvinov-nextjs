'use client';

import {createFormHook} from '@/hooks';
import {translations} from '@/lib';
import {Club, ClubFormData} from '@/types';

const t = translations.admin.clubs.responseMessages;
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

export const useClubForm = createFormHook<Club, ClubFormData>({
  initialFormData,
  validationRules: [{field: 'name', message: t.mandatoryName}],
});

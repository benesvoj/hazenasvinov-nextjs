import {translations} from '@/lib/translations/index';

import {ContactsSection} from '@/components';
import {PublicProfileCard} from '@/types';

const PROFILE_DATA: PublicProfileCard[] = [
  {
    id: '1',
    name: 'Zbyněk',
    surname: 'Planka',
    email: 'zbynek.planka@seznam.cz',
    photo_url: 'https://example.com/profile-photo.jpg',
    role: 'Předseda oddílu',
  },
  {
    id: '2',
    name: 'Vít',
    surname: 'Horáček',
    email: 'vitja1@seznam.cz',
    photo_url: 'https://example.com/profile-photo.jpg',
    role: 'Organizační pracovník',
  },
];

export const ContactHero = () => {
  return <ContactsSection contacts={PROFILE_DATA} title={translations.common.labels.contacts} />;
};

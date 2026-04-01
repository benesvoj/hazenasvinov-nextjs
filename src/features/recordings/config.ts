import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

export const recordingsConfig = {
  table: 'videos',

  entity: {
    singular: 'recording',
    plural: 'recordings',
  },

  api: {
    root: API_ROUTES.entities.root('videos'),
    byId: (id: string) => API_ROUTES.entities.byId('videos', id),
  },

  messages: translations.matchRecordings.responseMessages,
};

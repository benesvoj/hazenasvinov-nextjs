import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

export const rmatchesConfig = {
  table: 'matches',

  entity: {
    singular: 'matches',
    plural: 'matches',
  },

  api: {
    root: API_ROUTES.entities.root('matches'),
    byId: (id: string) => API_ROUTES.entities.byId('matches', id),
  },

  messages: 'messages',
};

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES, translations} from '@/lib';
import {Grant} from '@/types';

const t = translations.admin.grants.responseMessages;

export const useFetchGrants = createDataFetchHook<Grant>({
  endpoint: API_ROUTES.entities.root('grants'),
  entityName: 'grants',
  errorMessage: t.grantsFetchFailed,
});

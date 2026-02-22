import {createDataFetchHook} from '@/hooks/factories';

import {ENTITY} from '@/queries/userProfiles';
import {UserProfile} from '@/types';

export const useFetchUserProfiles = createDataFetchHook<UserProfile, {userId: string}>({
  endpoint: (params) => `/api/user-profiles?userId=${params.userId}`,
  entityName: ENTITY.plural,
  errorMessage: '...',
  fetchOnMount: false,
});

'use client';

import {createCRUDHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {DB_TABLE, ENTITY} from '@/queries/clubConfig';
import {ClubConfig, UpdateClubConfig} from '@/types';

export function useClubConfig() {
  const {loading, setLoading, error, update} = createCRUDHook<ClubConfig, UpdateClubConfig>({
    baseEndpoint: API_ROUTES.clubConfig.root,
    byIdEndpoint: (id) => API_ROUTES.entities.byId(DB_TABLE, id),
    entityName: ENTITY.singular,
    messages: {
      updateSuccess: translations.clubConfig.responseMessages.updateSuccess,
      updateError: translations.clubConfig.responseMessages.updateError,
    },
  })();

  return {
    loading,
    error,
    updateClubConfig: update,
    setLoading,
  };
}

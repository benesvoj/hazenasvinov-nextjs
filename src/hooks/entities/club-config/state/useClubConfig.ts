'use client';

import {translations} from '@/lib/translations/index';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES} from '@/lib';
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

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

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//
//   // Update club configuration
//   const updateClubConfig = useCallback(
//     async (id: string, data: Partial<UpdateClubConfig>) => {
//       try {
//         setLoading(true);
//         setError(null);
//
//         const res = await fetch(API_ROUTES.clubConfig.byId(id), {
//           method: 'PATCH',
//           headers: {'Content-Type': 'application/json'},
//           body: JSON.stringify(data),
//         });
//
//         const response = await res.json();
//
//
//         if (!res.ok || response.error) {
//           throw new Error(response.error || 'Failed to update club configuration');
//         }
//
//         showToast.success('Club configuration updated successfully');
//         return response;
//       } catch (err) {
//         console.error('Error updating club config:', err);
//         showToast.danger('Club configuration update failed');
//       } finally {
//         setLoading(false);
//       }
//     }, []
//   );
//
//   return {
//     loading,
//     error,
//     updateClubConfig,
//   };
// }

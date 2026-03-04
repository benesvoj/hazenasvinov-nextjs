'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {DB_TABLE, ENTITY} from '@/queries/memberAttendance';
import {MemberAttendanceWithMember} from '@/types';

export function useFetchMembersAttendance(params: {trainingSessionId: string}) {
  return createDataFetchHook<MemberAttendanceWithMember, {trainingSessionId: string}>({
    endpoint: (params) => {
      const searchParams = new URLSearchParams({
        trainingSessionId: params.trainingSessionId,
      });
      return `${API_ROUTES.entities.root(DB_TABLE)}?${searchParams.toString()}`;
    },
    entityName: ENTITY.plural,
    errorMessage: translations.attendance.responseMessages.memberAttendanceFetchFailed,
    fetchOnMount: false,
  })(params);
}

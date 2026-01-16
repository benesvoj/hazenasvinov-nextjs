'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES, translations} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/memberAttendance';
import {MemberAttendanceWithMember} from '@/types';

const t = translations.coachPortal.memberAttendance.responseMessages;

export function useFetchMembersAttendance(params: {trainingSessionId: string}) {
  return createDataFetchHook<
    MemberAttendanceWithMember,
    {trainingSessionId: string}
  >({
    endpoint: (params) => {
      const searchParams = new URLSearchParams({
        trainingSessionId: params.trainingSessionId,
      });
      return `${API_ROUTES.entities.root(DB_TABLE)}?${searchParams.toString()}`;
    },
    entityName: ENTITY.plural,
    errorMessage: t.memberAttendanceFetchFailed,
    fetchOnMount: false,
  })(params);
}

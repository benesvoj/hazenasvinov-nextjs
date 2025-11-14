'use client';

import {useCallback, useEffect, useState} from 'react';

import {showToast} from '@/components';
import {createDataFetchHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {Member} from '@/types';

const t = translations.admin.members.responseMessages;

// export const useFetchMembers = createDataFetchHook({
// 	endpoint: API_ROUTES.entities.root('members'),
// 	entityName: 'members',
// 	errorMessage: t.membersFetchFailed,
// })

export function useFetchMembers() {
  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_ROUTES.members.root);
      const response = await res.json();

      setData(response.data || []);
    } catch (error) {
      console.error('Error fetching members', error);
      setError('Error fetching members');
      showToast.danger('Error fetching members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

'use client';

import {useCallback, useEffect, useState} from 'react';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {showToast} from '@/components';
import {Member} from '@/types';

const t = translations.members.responseMessages;

interface UseFetchMembersOptions {
  /**
   * When `true`, deactivated (vyřazení) members are included as well.
   * Defaults to `false` — selection lists must offer active members only.
   */
  includeInactive?: boolean;
}

export function useFetchMembers({includeInactive = false}: UseFetchMembersOptions = {}) {
  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        includeInactive
          ? `${API_ROUTES.members.root}?includeInactive=true`
          : API_ROUTES.members.root
      );
      const response = await res.json();

      setData(response.data || []);
    } catch (error) {
      console.error('Error fetching members', error);
      setError('Error fetching members');
      showToast.danger('Error fetching members');
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

'use client';

import {useEffect, useState} from 'react';

import {showToast} from '@/components';
import {API_ROUTES, translations} from '@/lib';
import {Committee} from '@/types';

const t = translations.admin.committees.responseMessages;

export function useFetchCommittees() {
  const [data, setData] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_ROUTES.committees.root);
      const response = await res.json();

      setData(response.data || []);
    } catch (error) {
      console.error(t.committeesFetchFailed, error);
      setError(t.committeesFetchFailed);
      showToast.danger(t.committeesFetchFailed);
    } finally {
      setLoading(false);
    }
  };

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

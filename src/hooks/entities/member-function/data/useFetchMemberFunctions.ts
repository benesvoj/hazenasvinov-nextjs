'use client';

import {useEffect, useState} from 'react';

import {API_ROUTES} from '@/lib';
import {MemberFunction} from '@/types';

export function useFetchMemberFunctions() {
  const [data, setData] = useState<MemberFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_ROUTES.memberFunctions.root, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const response = await res.json();

      setData(response.data || []);
    } catch (error) {
      console.error('Failed to fetch member functions', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
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

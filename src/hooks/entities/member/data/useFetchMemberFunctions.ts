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
      setError(null); // Clear previous errors

      const res = await fetch(API_ROUTES.members.functions, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        // If API endpoint doesn't exist (404), that's expected initially
        if (res.status === 404) {
          console.warn('Member functions API not yet available, using fallback');
          setError(new Error('API_NOT_AVAILABLE'));
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setData(data || []);
    } catch (err) {
      console.error('Failed to fetch member functions', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // Set empty array on error to prevent undefined issues
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = () => {
    fetchData();
  };

  return {data, loading, error, refetch};
}

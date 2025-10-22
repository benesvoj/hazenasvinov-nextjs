'use client';

import {useEffect, useState} from 'react';

import {API_ROUTES} from '@/lib';
import {Category} from '@/types';

export function useFetchCategories() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(API_ROUTES.categories.root);
        const data = await res.json();
        setData(data);
      } catch (err) {
        console.error('Failed to fetch data', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {data, loading, error};
}

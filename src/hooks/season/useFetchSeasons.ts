import {useEffect, useState} from 'react';
import {Api} from '@/app/api/api';
import {Season} from '@/types';

export function useFetchSeasons() {
  const [data, setData] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(Api.getSeasons);
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

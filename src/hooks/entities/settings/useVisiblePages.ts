import {useState, useEffect} from 'react';

import {PageVisibility} from '@/types';

export const useVisiblePages = () => {
  const [visiblePages, setVisiblePages] = useState<PageVisibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisiblePages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/page-visibility');
      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }
      const allPages: PageVisibility[] = await response.json();

      // Filter only visible pages and sort by order
      const visible = allPages
        .filter((page) => page.is_visible && page.is_active)
        .sort((a, b) => a.sort_order - b.sort_order);

      setVisiblePages(visible);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisiblePages();
  }, []);

  return {
    visiblePages,
    loading,
    error,
    fetchVisiblePages,
  };
};

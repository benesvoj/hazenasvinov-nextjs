'use client';
import {useState, useEffect} from 'react';

import {PageVisibility} from '@/types';

export const usePageVisibility = () => {
  const [pages, setPages] = useState<PageVisibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/page-visibility');
      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }
      const data = await response.json();
      setPages(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updatePageVisibility = async (id: string, is_visible: boolean, sort_order: number) => {
    try {
      const response = await fetch('/api/page-visibility', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({id, is_visible, sort_order}),
      });

      if (!response.ok) {
        throw new Error('Failed to update page visibility');
      }

      const updatedPage = await response.json();
      setPages((prevPages) => prevPages.map((page) => (page.id === id ? updatedPage : page)));

      return updatedPage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const togglePageVisibility = async (id: string) => {
    const page = pages.find((p) => p.id === id);
    if (!page) return;

    const newVisibility = !page.is_visible;
    await updatePageVisibility(id, newVisibility, page.sort_order);
  };

  const updatePageOrder = async (id: string, newSortOrder: number) => {
    const page = pages.find((p) => p.id === id);
    if (!page) return;

    await updatePageVisibility(id, page.is_visible, newSortOrder);
  };

  const updatePageRoute = async (id: string, newRoute: string) => {
    try {
      const response = await fetch('/api/page-visibility', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({id, page_route: newRoute}),
      });

      if (!response.ok) {
        throw new Error('Failed to update page route');
      }

      const updatedPage = await response.json();
      setPages((prevPages) => prevPages.map((page) => (page.id === id ? updatedPage : page)));

      return updatedPage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const updatePageTitle = async (id: string, newTitle: string) => {
    try {
      const response = await fetch('/api/page-visibility', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({id, page_title: newTitle}),
      });

      if (!response.ok) {
        throw new Error('Failed to update page title');
      }

      const updatedPage = await response.json();
      setPages((prevPages) => prevPages.map((page) => (page.id === id ? updatedPage : page)));

      return updatedPage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  return {
    pages,
    loading,
    error,
    fetchPages,
    updatePageVisibility,
    togglePageVisibility,
    updatePageOrder,
    updatePageRoute,
    updatePageTitle,
  };
};

'use client';

import {useCallback, useEffect, useState} from 'react';

import {API_HELPERS} from '@/lib';
import {Blog} from '@/types';

interface UseFetchBlogPostResult {
  post: Blog | null;
  relatedPosts: Blog[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useFetchBlogPostBySlug(slug: string): UseFetchBlogPostResult {
  const [post, setPost] = useState<Blog | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!slug) {
        setLoading(false);
        return;
      }

      const res = await fetch(API_HELPERS.blog.bySlug(slug));
      const response = await res.json();

      if (!res.ok || response.error) {
        setError(response.error || 'Chyba při načítání článku');
        return;
      }
      if (response.data) {
        const {post: postData, relatedPosts: relatedData} = response.data || {};
        setPost(postData);
        setRelatedPosts(relatedData);
      } else {
        setError('Invalid response format');
        setPost(null);
        setRelatedPosts([]);
      }
    } catch (err) {
      console.error('Unexpected error fetching blog post by slug:', err);
      setError('Neočekávaná chyba při načítání článku');
      setPost(null);
      setRelatedPosts([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    post,
    relatedPosts,
    loading,
    error,
    refresh: fetchData,
  };
}

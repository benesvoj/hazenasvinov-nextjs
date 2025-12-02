'use client';

import {useCallback, useEffect, useState} from 'react';

import {API_HELPERS} from '@/lib';
import {Blog} from '@/types';
import {transformBlogPostForPublic} from '@/utils';

export const useFetchBlogPostsPublished = (limit: number = 3) => {
  const [posts, setPosts] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_HELPERS.blogPostsPublished.withLimit(limit));
      const {data, error: fetchError} = await res.json();

      if (fetchError) {
        console.error('Error fetching blog posts:', fetchError);

        setPosts([]);
        return;
      }

      setPosts((data || []).map(transformBlogPostForPublic));
    } catch (err) {
      console.error('Unexpected error fetching blog posts:', err);
      setError('Neočekávaná chyba při načítání článků');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    refresh: fetchPosts,
  };
};

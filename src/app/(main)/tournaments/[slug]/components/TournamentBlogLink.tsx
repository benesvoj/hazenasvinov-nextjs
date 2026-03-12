'use client';

import {useEffect, useState} from 'react';

import Link from 'next/link';

import {Button} from '@heroui/button';

import {DocumentTextIcon} from '@heroicons/react/24/outline';

import {APP_ROUTES} from '@/lib/app-routes';
import {translations} from '@/lib/translations';

import {HStack} from '@/components';
import {useSupabaseClient} from '@/hooks';

interface TournamentBlogLinkProps {
  postId: string;
  slug: string;
}

export function TournamentBlogLink({postId}: TournamentBlogLinkProps) {
  const supabase = useSupabaseClient();
  const [postSlug, setPostSlug] = useState<string | null>(null);
  const [postTitle, setPostTitle] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      const {data} = await supabase
        .from('blog_posts')
        .select('slug, title')
        .eq('id', postId)
        .eq('status', 'published')
        .single();

      if (data) {
        setPostSlug(data.slug);
        setPostTitle(data.title);
      }
    };
    void fetchPost();
  }, [postId, supabase]);

  if (!postSlug) return null;

  return (
    <Link href={APP_ROUTES.public.blogPost(postSlug)}>
      <Button variant="flat" startContent={<DocumentTextIcon className="w-5 h-5" />}>
        <HStack spacing={2}>
          <span>{translations.tournaments.labels.blogPost}:</span>
          <span className="font-semibold">{postTitle}</span>
        </HStack>
      </Button>
    </Link>
  );
}

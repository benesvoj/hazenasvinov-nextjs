'use client';

import Image from 'next/image';

import {CalendarIcon, UserIcon} from '@heroicons/react/24/outline';

import {useQuery} from '@tanstack/react-query';

import {BlogContent, BlogPostCard} from '@/components/features';
import {MatchInfo} from '@/components/shared';
import {Heading} from '@/components/ui';
import {CategoryChip} from '@/components/ui/chips';

import {SponsorsTemp} from '@/app/(main)/components/SponsorsTemp';

import {formatDateString} from '@/helpers';
import {translations} from '@/lib';
import {fetchBlogPostBySlug, fetchBlogPostMatch} from '@/queries/blogPosts/queries';

import {BackButton, ContentDivider, ShareButtons} from './components';

interface BlogPostClientProps {
  slug: string;
}

export function BlogPostClient({slug}: BlogPostClientProps) {
  const t = translations.landingPage.posts;

  // Data is already prefetched on server and hydrated here
  const {data, isLoading, error} = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => fetchBlogPostBySlug(slug),
  });

  // Fetch match data if post has match_id (optional, only when needed)
  const {data: matchData} = useQuery({
    queryKey: ['blog-post-match', data?.post?.match_id],
    queryFn: () => fetchBlogPostMatch(data!.post.match_id!),
    enabled: !!data?.post?.match_id,
  });

  // Handle loading state (should rarely show due to server prefetch)
  if (isLoading || !data) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-red-600">Error loading blog post</p>
        <BackButton label={t.backToPosts} />
      </div>
    );
  }

  const {post, relatedPosts, category} = data;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Button */}
      <div>
        <BackButton label={t.backToPosts} />
      </div>

      {/* Article */}
      <article>
        <header className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{post.title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span>{post.author_id === 'default-user' ? 'Admin' : `ID: ${post.author_id}`}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span>{post.published_at ? formatDateString(post.published_at) : '-'}</span>
            </div>
            {category && (
              <div className="flex flex-wrap gap-2">
                <CategoryChip category={category} />
              </div>
            )}
          </div>
        </header>

        {/* Image */}
        {post.image_url && (
          <div className="my-8">
            <Image
              src={post.image_url}
              alt={post.title}
              width={800}
              height={400}
              className="w-full h-64 lg:h-80 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Content */}
        <BlogContent content={post.content} />

        {/* Related Match */}
        {matchData && (
          <>
            <ContentDivider />
            <MatchInfo match={matchData} />
          </>
        )}

        <SponsorsTemp />

        {/* Share Buttons */}
        <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <ShareButtons />
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section>
          <Heading size={2}>Související články</Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedPosts.map((relatedPost: any) => (
              <BlogPostCard key={relatedPost.id} post={relatedPost} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

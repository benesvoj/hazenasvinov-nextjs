import Image from 'next/image';
import {notFound} from 'next/navigation';

import {Button, Chip, Divider} from '@heroui/react';

import {
  ArrowLeftIcon,
  BookmarkIcon,
  CalendarIcon,
  ShareIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

import {BlogContent, BlogPostCard} from '@/components/features';
import {MatchInfo} from '@/components/shared';
import {Heading, Link} from '@/components/ui';

import {createClient} from '@/utils/supabase/server';

import {SponsorsTemp} from '@/app/(main)/components/SponsorsTemp';

import {formatDateString} from '@/helpers';
import {translations} from '@/lib';

const t = translations.landingPage.posts;

// ✅ Server Component (no 'use client'!)
export default async function BlogPostPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  const supabase = await createClient();

  // ✅ Fetch blog post on server
  const {data: post, error: postError} = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  // ✅ Handle not found
  if (postError || !post) {
    notFound(); // Next.js 404 page
  }

  // ✅ Fetch related data in parallel
  const [{data: categories}, {data: relatedPosts}, {data: matchData}] = await Promise.all([
    // Categories (for badge)
    supabase.from('categories').select('*'),

    // Related posts (same category)
    post.category_id
      ? supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .eq('category_id', post.category_id)
          .neq('slug', slug)
          .order('published_at', {ascending: false})
          .limit(2)
      : Promise.resolve({data: null}),

    // Related match (if post has match_id)
    post.match_id
      ? supabase
          .from('matches')
          .select(
            `
            *,
            home_team:home_team_id(
              id,
              team_suffix,
              club_category:club_categories(
                club:clubs(id, name, short_name, logo_url, is_own_club)
              )
            ),
            away_team:away_team_id(
              id,
              team_suffix,
              club_category:club_categories(
                club:clubs(id, name, short_name, logo_url, is_own_club)
              )
            ),
            category:categories(id, name),
            season:seasons(id, name)
          `
          )
          .eq('id', post.match_id)
          .single()
      : Promise.resolve({data: null}),
  ]);

  const category = categories?.find((c) => c.id === post.category_id);

  // ✅ Render immediately - NO loading state needed!
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Button */}
      <div>
        <Button
          as={Link}
          href="/blog"
          variant="bordered"
          startContent={<ArrowLeftIcon className="w-4 h-4" />}
        >
          {t.backToPosts}
        </Button>
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
              <Chip size="sm" variant="solid" color="primary">
                {category.name}
              </Chip>
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
            <Divider className="my-6" />
            <MatchInfo match={matchData} />
          </>
        )}

        <SponsorsTemp />

        {/* Share Buttons */}
        <div className="flex items-center justify-between mt-8 pt-8 border-t">
          <div className="flex items-center gap-4">
            <Button variant="bordered" size="sm" startContent={<ShareIcon className="w-4 h-4" />}>
              Sdílet
            </Button>
            <Button
              variant="bordered"
              size="sm"
              startContent={<BookmarkIcon className="w-4 h-4" />}
            >
              Uložit
            </Button>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section>
          <Heading size={2}>Související články</Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedPosts.map((relatedPost) => (
              <BlogPostCard key={relatedPost.id} post={relatedPost} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ✅ BONUS: Pre-render popular posts at build time for even faster loads!
export async function generateStaticParams() {
  const supabase = await createClient();

  const {data: posts} = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('status', 'published')
    .order('published_at', {ascending: false})
    .limit(20); // Pre-render 20 most recent posts

  return posts?.map((post) => ({slug: post.slug})) || [];
}

// ✅ Enable ISR (Incremental Static Regeneration)
export const revalidate = 3600; // Revalidate every hour

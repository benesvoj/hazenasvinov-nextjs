'use client';

import {Button} from '@heroui/button';
import {Card, CardBody} from '@heroui/card';

import {TagIcon, ArrowRightIcon} from '@heroicons/react/24/outline';

import {useFetchBlogPostsPublished} from '@/hooks/entities/blog/data/useFetchBlogPostsPublished';

import {BlogPostCard, BlogPostCardSkeleton} from '@/components/features';
import {Link} from '@/components/ui';

import {translations} from '@/lib/translations/index';

import {APP_ROUTES} from '@/lib';
import {hasItems} from '@/utils';

export default function PostSection() {
  const {
    posts: latestPosts,
    loading: postsLoading,
    error: postsError,
  } = useFetchBlogPostsPublished(3);

  return (
    <section className="relative">
      {/* Section Header with enhanced styling */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {translations.public.landingPage.posts.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {translations.public.landingPage.posts.description}
        </p>
      </div>

      {/* Enhanced Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {postsLoading ? (
          // Enhanced Loading State with background image skeletons
          <>
            {[1, 2, 3].map((i) => (
              <BlogPostCardSkeleton key={i} />
            ))}
          </>
        ) : postsError ? (
          // Enhanced Error State
          <div className="col-span-full">
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 overflow-hidden">
              <CardBody className="text-center p-8">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TagIcon className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                  {translations.public.landingPage.posts.errorPosts}
                </h3>
                <p className="text-red-600 dark:text-red-400 mb-4 max-w-md mx-auto">{postsError}</p>
                <Button
                  color="primary"
                  variant="bordered"
                  onPress={() => window.location.reload()}
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  {translations.common.actions.tryAgain}
                </Button>
              </CardBody>
            </Card>
          </div>
        ) : latestPosts && latestPosts.length > 0 ? (
          // Enhanced Success State - Background Image Cards with Overlay Text
          latestPosts.map((post, index) => (
            <BlogPostCard key={post.id} post={post} index={index} variant="landing" />
          ))
        ) : (
          // Enhanced No Posts State
          <div className="col-span-full">
            <Card className="border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 overflow-hidden">
              <CardBody className="text-center p-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TagIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  {translations.public.landingPage.posts.noPosts}
                </h3>
                <Button
                  as={Link}
                  href={APP_ROUTES.public.blog}
                  color="primary"
                  variant="bordered"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  {translations.public.landingPage.posts.browsePostsButton}
                </Button>
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      {/* Enhanced View All Button */}
      {hasItems(latestPosts) && (
        <div className="text-center mt-8">
          <Button
            as={Link}
            href={APP_ROUTES.public.blog}
            size="md"
            color="primary"
            variant="bordered"
            className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
            endContent={<ArrowRightIcon className="w-4 h-4" />}
          >
            {translations.public.landingPage.posts.viewAllPostsButton}
          </Button>
        </div>
      )}
    </section>
  );
}

'use client';

import { Card, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import Link from "@/components/Link";
import { TagIcon } from "@heroicons/react/24/outline";
import { BlogPostCardSkeleton } from "@/components/BlogPostCard";
import BlogPostCard from '@/components/BlogPostCard'
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { useFetchCategoryPosts } from "@/hooks/useFetchCategoryPosts";

interface CategoryPostsProps {
  categoryName: string;
  categorySlug: string;
}

export function CategoryPosts({ categoryName, categorySlug }: CategoryPostsProps) {
  const { posts: latestPosts, loading: postsLoading, error: postsError } = useFetchCategoryPosts(categorySlug, 3);
  return (
    <section className="relative">
      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          <strong>Debug:</strong> Category: {categoryName} | Slug: {categorySlug} | 
          Posts found: {latestPosts?.length || 0}
          {latestPosts && latestPosts.length > 0 && (
            <div className="mt-2">
              <strong>Posts:</strong>
              <ul className="list-disc list-inside">
                {latestPosts.map(post => (
                  <li key={post.id}>
                    &ldquo;{post.title}&rdquo; - Tags: {post.tags?.join(', ') || 'none'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {postsLoading ? (
          // Loading State
          <>
            {[1, 2, 3].map((i) => (
              <BlogPostCardSkeleton key={i} />
            ))}
          </>
        ) : postsError ? (
          // Error State
          <div className="col-span-full">
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 overflow-hidden">
              <CardBody className="text-center p-8">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TagIcon className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                  Chyba při načítání novinek
                </h3>
                <p className="text-red-600 dark:text-red-400 mb-4 max-w-md mx-auto">
                  {postsError}
                </p>
                <Button 
                  color="primary" 
                  variant="bordered"
                  onPress={() => window.location.reload()}
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Zkusit znovu
                </Button>
              </CardBody>
            </Card>
          </div>
        ) : latestPosts && latestPosts.length > 0 ? (
          // Success State
          latestPosts.map((post, index) => (
            <BlogPostCard 
              key={post.id} 
              post={post} 
              index={index}
              variant="landing"
            />
          ))
        ) : (
          // No Posts State
          <div className="col-span-full">
            <Card className="border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 overflow-hidden">
              <CardBody className="text-center p-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TagIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Zatím žádné novinky
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-lg mx-auto">
                  Pro tuto kategorii zatím nejsou k dispozici žádné články.
                </p>
              </CardBody>
              <CardFooter className="flex justify-center">
              <Button 
                  as={Link} 
                  href="/blog" 
                  color="primary"
                  variant="bordered"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  Procházet všechny novinky
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>

      {/* View All Button */}
      {latestPosts && latestPosts.length > 0 && (
        <div className="text-center mt-8">
          <Button 
            as={Link} 
            href="/blog" 
            size="md"
            color="primary"
            variant="bordered"
            className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
            endContent={<ArrowRightIcon className="w-4 h-4" />}
          >
            Zobrazit všechny novinky
          </Button>
        </div>
      )}
    </section>
  );
}

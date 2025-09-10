"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Card, CardBody, Button, Chip,Divider} from "@heroui/react";
// TODO: Remove Link from here, use Heroui Link
import Link from "@/components/Link";
import { useCategories, useFetchBlogPost } from "@/hooks";
import { useFetchPostMatch } from "@/hooks/useFetchPostMatch";
import {
  CalendarIcon,
  UserIcon,
  TagIcon,
  ArrowLeftIcon,
  ShareIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import { translations } from "@/lib/translations";
import { BlogPostCard, Heading, MatchInfo } from "@/components";
import BlogContent from "@/components/BlogContent";

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { post, relatedPosts, loading, error } = useFetchBlogPost(slug);
  const { categories, fetchCategories } = useCategories();
  const { match: relatedMatch, loading: matchLoading } = useFetchPostMatch(
    post?.id || null
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const t = translations.landingPage.posts;

  const category = post
    ? categories.find((category) => category.id === post.category_id)
    : null;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-8"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded mb-8"></div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center py-12">
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <CardBody className="text-center">
              <TagIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                {error || "Článek nebyl nalezen"}
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-4">
                Požadovaný článek nebyl nalezen nebo není dostupný.
              </p>
              <Button as={Link} href="/blog" color="primary" variant="bordered">
                {t.backToPosts}
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

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

      {/* Article Header */}
      <article>
        <header className="space-y-4">
          {/* Post Title */}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {post.title}
          </h1>

          {/* Post Meta */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span>
                {post.author_id === "default-user"
                  ? "Admin"
                  : `ID: ${post.author_id}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span>
                {new Date(
                  post.published_at || post.created_at
                ).toLocaleDateString("cs-CZ")}
              </span>
            </div>
            {category && (
              <div className="flex flex-wrap gap-2">
                <Chip
                  size="sm"
                  variant="solid"
                  color="primary"
                  className="px-2 py-1"
                >
                  {category.name}
                </Chip>
              </div>
            )}
          </div>
        </header>

        {/* Featured Image */}
        <div className="my-8">
          {post.image_url && (
            <Image
              src={post.image_url}
              alt={post.title}
              width={800}
              height={400}
              className="w-full h-64 lg:h-80 object-cover rounded-lg"
            />
          )}
        </div>

        {/* Article Content */}
        <BlogContent content={post.content} />

        {/* Related Match Information */}
        {relatedMatch && !matchLoading && (
          <>
            <Divider className="my-6" />
            <MatchInfo match={relatedMatch} />
          </>
        )}

        {/* Share and Bookmark */}
        <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Button
              variant="bordered"
              size="sm"
              startContent={<ShareIcon className="w-4 h-4" />}
            >
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
      {relatedPosts.length > 0 && (
        <section>
          <Heading size={2}>Související články</Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedPosts.map((relatedPost) => (
              <BlogPostCard key={relatedPost.id} post={relatedPost} />
            ))}
          </div>
        </section>
      )}

      {/* Newsletter Signup */}
      {/* <Card className="bg-linear-to-r from-blue-600 to-blue-700 text-white">
        <CardBody className="text-center">
          <h3 className="text-2xl font-bold mb-2">
            Nechte si posílat novinky
          </h3>
          <p className="text-blue-100 mb-4">
            Přihlaste se k odběru novinek a buďte první, kdo se dozví o důležitých událostech v našem oddílu.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Váš email"
              className="flex-1 px-4 py-2 rounded-md text-gray-900"
            />
            <Button color="primary" className="bg-white text-blue-600 hover:bg-blue-50">
              Přihlásit
            </Button>
          </div>
        </CardBody>
      </Card> */}
    </div>
  );
}

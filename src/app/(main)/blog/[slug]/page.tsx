'use client';

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import Link from "@/components/Link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  CalendarIcon, 
  UserIcon, 
  TagIcon,
  ArrowLeftIcon,
  ShareIcon,
  BookmarkIcon,
  PhotoIcon
} from "@heroicons/react/24/outline";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author_id: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  image_url?: string;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // Fetch the specific post by slug
        const { data: postData, error: postError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (postError) {
          if (postError.code === 'PGRST116') {
            setError('Článek nebyl nalezen');
          } else {
            setError(`Chyba při načítání článku: ${postError.message}`);
          }
          return;
        }

        setPost(postData);

        // Fetch related posts (same tags, different post)
        if (postData.tags && postData.tags.length > 0) {
          const { data: relatedData, error: relatedError } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('status', 'published')
            .neq('id', postData.id)
            .overlaps('tags', postData.tags)
            .order('published_at', { ascending: false, nullsLast: true })
            .order('created_at', { ascending: false })
            .limit(3);

          if (!relatedError && relatedData) {
            setRelatedPosts(relatedData);
          }
        }

      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError('Neočekávaná chyba při načítání článku');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

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
                {error || 'Článek nebyl nalezen'}
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-4">
                Požadovaný článek nebyl nalezen nebo není dostupný.
              </p>
              <Button 
                as={Link} 
                href="/blog"
                color="primary" 
                variant="bordered"
              >
                Zpět na novinky
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
          Zpět na novinky
        </Button>
      </div>

      {/* Article Header */}
      <article>
        <header className="space-y-4">
          {/* Post Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <Chip
                  key={index}
                  size="sm"
                  variant="bordered"
                  color="primary"
                >
                  {tag}
                </Chip>
              ))}
            </div>
          )}
          
          {/* Post Title */}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {post.title}
          </h1>
          
          {/* Post Meta */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span>{post.author_id === 'default-user' ? 'Admin' : `ID: ${post.author_id}`}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span>{new Date(post.published_at || post.created_at).toLocaleDateString('cs-CZ')}</span>
            </div>
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
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>

        {/* Tags */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tagy:</span>
            {post.tags && post.tags.map((tag) => (
              <span 
                key={tag}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Související články
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedPosts.map((relatedPost) => (
              <Card key={relatedPost.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-0">
                  {/* Related Post Image */}
                  {relatedPost.image_url ? (
                    <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={relatedPost.image_url}
                        alt={relatedPost.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <PhotoIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Related Post Tags */}
                  {relatedPost.tags && relatedPost.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {relatedPost.tags.slice(0, 2).map((tag, index) => (
                        <Chip
                          key={index}
                          size="sm"
                          variant="bordered"
                          color="primary"
                          className="text-xs"
                        >
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  )}
                  
                  {/* Related Post Title */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {relatedPost.title}
                  </h3>
                </CardHeader>
                
                <CardBody>
                  {/* Related Post Excerpt */}
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {relatedPost.excerpt}
                  </p>
                  
                  {/* Related Post Meta */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(relatedPost.published_at || relatedPost.created_at).toLocaleDateString('cs-CZ')}
                    </span>
                    <Button 
                      as={Link} 
                      href={`/blog/${relatedPost.slug}`}
                      size="sm" 
                      color="primary"
                    >
                      Přečíst
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter Signup */}
      <Card className="bg-linear-to-r from-blue-600 to-blue-700 text-white">
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
      </Card>
    </div>
  );
} 
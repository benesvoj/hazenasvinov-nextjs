'use client';

import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import Link from "@/components/Link";
import Image from "next/image";
import { CalendarIcon } from "@heroicons/react/24/outline";

export interface BlogPost {
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

interface BlogPostCardProps {
  post: BlogPost;
  index?: number;
  variant?: 'landing' | 'blog';
  className?: string;
}

export default function BlogPostCard({ 
  post, 
  index = 0, 
  variant = 'landing',
  className = ''
}: BlogPostCardProps) {
  const isLandingVariant = variant === 'landing';
  
  if (isLandingVariant) {
    // Landing page variant - background image with overlay text
    return (
      <Card 
        className={`group overflow-hidden hover:shadow-xl transition-all duration-300 ease-out border-0 bg-white dark:bg-gray-800 h-64 relative ${className}`}
        style={{
          animationDelay: `${index * 100}ms`,
          animation: 'fadeInUp 0.6s ease-out forwards'
        }}
      >
        {/* Background Image */}
        {post.image_url ? (
          <Image
            src={post.image_url}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800" />
        )}
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        
        {/* Content Overlay - Always Visible */}
        <div className="relative z-10 h-full flex flex-col justify-end p-6 text-white">
          {/* Title - Always Visible */}
          <h3 className="text-xl font-bold mb-3 line-clamp-2 leading-tight">
            {post.title}
          </h3>
          
          {/* Excerpt - Always Visible */}
          <p className="text-gray-200 mb-4 line-clamp-2 leading-relaxed text-sm">
            {post.excerpt}
          </p>
          
          {/* Bottom Row - Category and Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Category/Tags */}
              {post.tags && post.tags.length > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white/20 backdrop-blur-sm text-white border border-white/30">
                  {post.tags[0]}
                </span>
              )}
              
              {/* Date */}
              <div className="flex items-center gap-1 text-xs text-gray-300">
                <CalendarIcon className="w-3 h-3" />
                <span>
                  {new Date(post.created_at).toLocaleDateString('cs-CZ', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
            
            {/* Read Button */}
            <Button 
              as={Link} 
              href={`/blog/${post.slug}`}
              size="sm" 
              color="primary"
              variant="solid"
              className="bg-white text-gray-900 hover:bg-gray-100 text-xs px-3 py-1 h-7"
            >
              Přečíst
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Blog page variant - traditional card layout
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
      <div className="p-6">
        {/* Post Image */}
        {post.image_url ? (
          <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
            <Image
              src={post.image_url}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="w-full h-48 mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-gray-400 text-4xl">📰</div>
          </div>
        )}
        
        {/* Post Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.slice(0, 3).map((tag, tagIndex) => (
              <span
                key={tagIndex}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              >
                {tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                +{post.tags.length - 3}
              </span>
            )}
          </div>
        )}
        
        {/* Post Title */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white line-clamp-2 mb-3">
          {post.title}
        </h2>
        
        {/* Post Excerpt */}
        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 leading-relaxed">
          {post.excerpt}
        </p>
        
        {/* Post Meta */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <CalendarIcon className="w-4 h-4" />
            <span>
              {new Date(post.created_at).toLocaleDateString('cs-CZ', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Read More Button */}
        <Button 
          as={Link} 
          href={`/blog/${post.slug}`}
          size="sm" 
          color="primary"
          variant="solid"
          className="w-full"
        >
          Přečíst více
        </Button>
      </div>
    </Card>
  );
}

// Loading skeleton component
export function BlogPostCardSkeleton({ variant = 'landing', className = '' }: { variant?: 'landing' | 'blog', className?: string }) {
  if (variant === 'landing') {
    return (
      <Card className={`animate-pulse overflow-hidden h-64 relative ${className}`}>
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="relative z-10 h-full flex flex-col justify-end p-6">
          <div className="space-y-3 mb-4">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
            </div>
            <div className="h-7 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`animate-pulse overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
        <div className="space-y-3 mb-4">
          <div className="flex gap-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </div>
    </Card>
  );
}

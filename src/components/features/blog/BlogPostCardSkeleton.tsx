'use client';
import {Card} from '@heroui/react';

/**
 * @description Loading skeleton component for BlogPostCard
 * @param variant - variant of the card
 * @param className - class name for the card
 * @returns Loading skeleton component for BlogPostCard
 * @todo - add loading skeleteon from Heroui
 */
// Loading skeleton component
export default function BlogPostCardSkeleton({
  variant = 'landing',
  className = '',
}: {
  variant?: 'landing' | 'blog';
  className?: string;
}) {
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

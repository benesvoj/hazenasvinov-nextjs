'use client';

import {Chip} from '@heroui/react';

import {Category} from '@/types';

interface CategoryChipProps {
  category: Category;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Reusable category chip component
 * Use for displaying category badges across the app (blog posts, categories pages, etc.)
 */
export function CategoryChip({category, size = 'sm', className = ''}: CategoryChipProps) {
  return (
    <Chip size={size} variant="solid" color="primary" className={`${className}`}>
      {category.name}
    </Chip>
  );
}

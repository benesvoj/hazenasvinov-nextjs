import {BlogPost} from './blogPost';
import {Category} from '@/types';

/**
 * @description Props for BlogPostCard component
 */

export interface BlogPostCard {
  post: BlogPost;
  index?: number;
  /**
   * @default 'landing'
   * @description 'landing' for landing page, 'blog' for blog page
   */
  variant?: 'landing' | 'blog';
  className?: string;
  /**
   * @description Optional category data - if not provided, will be fetched from context (requires AppDataProvider)
   */
  category?: Category;
}

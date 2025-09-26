import {BlogPost} from './blogPost';

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
}

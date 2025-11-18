import {
  BlogPostInsert,
  BlogPostSchema,
  BlogPostUpdate,
} from '@/types/entities/blog/schema/blogPostsSchema';

export interface Blog extends BlogPostSchema {}

export interface CreateBlogPost extends BlogPostInsert {}

export interface UpdateBlogPost extends BlogPostUpdate {}

export type BlogPostFormData = Omit<Blog, 'id' | 'created_at' | 'updated_at'>;

import {Blog} from '@/types';

export function transformBlogPostForPublic(post: Blog): Blog {
  return {
    ...post,
    image_url: post.image_url || null,
  };
}

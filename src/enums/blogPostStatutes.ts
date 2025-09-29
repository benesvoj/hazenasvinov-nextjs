import {translations} from '@/lib/translations';

const t = translations.common.blogPostStatuses;

export enum BlogPostStatuses {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export const BLOG_POST_STATUSES: Record<BlogPostStatuses, string> = {
  [BlogPostStatuses.DRAFT]: t.draft,
  [BlogPostStatuses.PUBLISHED]: t.published,
  [BlogPostStatuses.ARCHIVED]: t.archived,
} as const;

export const getBlogPostStatusOptions = () =>
  Object.entries(BLOG_POST_STATUSES).map(([value, label]) => ({
    value: value as BlogPostStatuses,
    label,
  }));

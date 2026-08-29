// TODO: This file is a bit of a catch-all for post-related constants.
// Duplicate with src/lib/translations/blogPosts.ts

import {translations} from '@/lib/translations';

import {blogPostStatusHelpers} from '@/features/blogPosts';

const t = translations.blogPosts.enums.statuses;

const labels = blogPostStatusHelpers.getLabels();

export const adminStatusFilterOptions = {
  all: t.all,
  ...labels,
} as const;

// Mapping from filter keys to database values
export const statusFilterToDbValue = {
  all: 'all',
  draft: 'draft',
  published: 'published',
  archived: 'archived',
} as const;

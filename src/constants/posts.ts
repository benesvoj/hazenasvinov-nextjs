import {translations} from '@/lib/translations';

import {BLOG_POST_STATUSES} from '@/enums';

const t = translations.common.blogPostStatuses;

export const adminStatusFilterOptions = {
  all: t.all,
  ...BLOG_POST_STATUSES,
} as const;

// Mapping from filter keys to database values
export const statusFilterToDbValue = {
  all: 'all',
  draft: 'draft',
  published: 'published',
  archived: 'archived',
} as const;

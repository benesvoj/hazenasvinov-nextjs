import {translations} from '@/lib/translations';

import {createEnumHelpers} from '@/shared/lib';

import {BlogPostStatuses} from '../../../enums/blogPostStatutes';

export const blogPostStatusHelpers = createEnumHelpers(BlogPostStatuses, () => {
  const t = translations.blogPosts.enums.statuses;

  return {
    [BlogPostStatuses.DRAFT]: t.draft,
    [BlogPostStatuses.PUBLISHED]: t.published,
    [BlogPostStatuses.ARCHIVED]: t.archived,
  };
});

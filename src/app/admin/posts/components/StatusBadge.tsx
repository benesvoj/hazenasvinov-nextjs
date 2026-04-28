import React from 'react';

import {BlogPostStatuses} from '@/enums';
import {StatusBadge} from '@/features/blogPosts';

export const getStatusBadge = (status: string) => {
  switch (status) {
    case BlogPostStatuses.PUBLISHED:
      return <StatusBadge status={BlogPostStatuses.PUBLISHED} />;
    case BlogPostStatuses.DRAFT:
      return <StatusBadge status={BlogPostStatuses.DRAFT} />;
    case BlogPostStatuses.ARCHIVED:
      return <StatusBadge status={BlogPostStatuses.ARCHIVED} />;
    default:
      return null;
  }
};

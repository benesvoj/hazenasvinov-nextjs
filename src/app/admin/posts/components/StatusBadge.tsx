import React from 'react';

import {Chip} from '@heroui/react';

import {adminStatusFilterOptions} from '@/constants';
import {BlogPostStatuses} from '@/enums';

export const getStatusBadge = (status: string) => {
  switch (status) {
    case BlogPostStatuses.PUBLISHED:
      return (
        <Chip color="success" variant="flat">
          {adminStatusFilterOptions.published}
        </Chip>
      );
    case BlogPostStatuses.DRAFT:
      return (
        <Chip color="warning" variant="flat">
          {adminStatusFilterOptions.draft}
        </Chip>
      );
    case BlogPostStatuses.ARCHIVED:
      return (
        <Chip color="secondary" variant="flat">
          {adminStatusFilterOptions.archived}
        </Chip>
      );
    default:
      return null;
  }
};

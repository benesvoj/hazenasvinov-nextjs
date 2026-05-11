'use client';

import {Chip} from '@heroui/react';

import {BlogPostStatuses} from '@/enums';

import {blogPostStatusHelpers} from '../model/status';

const STATUS_COLORS: Record<BlogPostStatuses, 'success' | 'warning' | 'secondary'> = {
  [BlogPostStatuses.PUBLISHED]: 'success',
  [BlogPostStatuses.DRAFT]: 'warning',
  [BlogPostStatuses.ARCHIVED]: 'secondary',
};

interface Props {
  status: BlogPostStatuses;
}

export function StatusBadge({status}: Props) {
  const labels = blogPostStatusHelpers.getLabels();

  return (
    <Chip color={STATUS_COLORS[status]} variant="flat">
      {labels[status]}
    </Chip>
  );
}

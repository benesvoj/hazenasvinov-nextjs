'use client';

import {Chip} from '@heroui/react';

interface CategoryBadgeProps {
  name: string;
}

export function CategoryBadge({name}: CategoryBadgeProps) {
  return (
    <Chip size="sm" variant="solid" color="primary">
      {name}
    </Chip>
  );
}

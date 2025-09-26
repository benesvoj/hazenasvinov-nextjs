'use client';

import React from 'react';
import {Chip} from '@heroui/react';
import {TrainingSessionStatus} from '@/types/entities/attendance/data/attendance';

interface TrainingSessionStatusBadgeProps {
  status: TrainingSessionStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  planned: {
    label: 'Naplánován',
    color: 'default' as const,
    variant: 'flat' as const,
  },
  done: {
    label: 'Proveden',
    color: 'success' as const,
    variant: 'flat' as const,
  },
  cancelled: {
    label: 'Zrušen',
    color: 'danger' as const,
    variant: 'flat' as const,
  },
};

export default function TrainingSessionStatusBadge({
  status,
  size = 'sm',
}: TrainingSessionStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Chip color={config.color} variant={config.variant} size={size} className="font-medium">
      {config.label}
    </Chip>
  );
}

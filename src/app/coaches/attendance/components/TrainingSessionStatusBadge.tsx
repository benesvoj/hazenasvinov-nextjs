import React from 'react';

import {Chip} from '@heroui/react';

import {getTrainingSessionStatusOptions, TrainingSessionStatusEnum} from '@/enums';
import {trainingSessionStatusOptions} from '@/utils';

interface TrainingSessionStatusBadgeProps {
  status: TrainingSessionStatusEnum;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  planned: {
    color: 'default' as const,
    variant: 'flat' as const,
  },
  done: {
    color: 'success' as const,
    variant: 'flat' as const,
  },
  cancelled: {
    color: 'danger' as const,
    variant: 'flat' as const,
  },
};

export default function TrainingSessionStatusBadge({
  status,
  size = 'sm',
}: TrainingSessionStatusBadgeProps) {
  const config = statusConfig[status];
  const statusOptions = trainingSessionStatusOptions();

  return (
    <Chip color={config.color} variant={config.variant} size={size} className="font-medium">
      {statusOptions[status]}
    </Chip>
  );
}

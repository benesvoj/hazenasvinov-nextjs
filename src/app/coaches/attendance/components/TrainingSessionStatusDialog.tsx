'use client';

import React, {useState} from 'react';

import {Alert, Select, SelectItem, Textarea} from '@heroui/react';

import {translations} from '@/lib/translations/index';

import {UnifiedModal} from '@/components';
import {TrainingSessionStatusEnum} from '@/enums';

interface TrainingSessionStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: TrainingSessionStatusEnum, reason?: string) => void;
  currentStatus: TrainingSessionStatusEnum;
  sessionTitle: string;
}

const statusOptions = [
  {
    key: TrainingSessionStatusEnum.PLANNED,
    label: 'Naplánován',
    description: translations.trainingSessions.statuses.description.planned,
    color: 'default',
  },
  {
    key: TrainingSessionStatusEnum.DONE,
    label: 'Proveden',
    description: translations.trainingSessions.statuses.description.done,
    color: 'success',
  },
  {
    key: TrainingSessionStatusEnum.CANCELLED,
    label: 'Zrušen',
    description: translations.trainingSessions.statuses.description.cancelled,
    color: 'danger',
  },
];

export default function TrainingSessionStatusDialog({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  sessionTitle,
}: TrainingSessionStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<TrainingSessionStatusEnum>(currentStatus);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (selectedStatus === TrainingSessionStatusEnum.CANCELLED && !cancellationReason.trim()) {
      return; // Don't allow cancellation without reason
    }

    setIsSubmitting(true);
    try {
      onConfirm(
        selectedStatus,
        selectedStatus === TrainingSessionStatusEnum.CANCELLED ? cancellationReason : undefined
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedStatus(currentStatus);
    setCancellationReason('');
    onClose();
  };

  const isCancellationReasonRequired = selectedStatus === TrainingSessionStatusEnum.CANCELLED;
  const canConfirm = !isCancellationReasonRequired || cancellationReason.trim().length > 0;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={translations.trainingSessions.changeTrainingSessionStatus}
      size="md"
      isFooterWithActions
      onPress={handleConfirm}
      isDisabled={!canConfirm || isSubmitting}
    >
      <div className="space-y-4">
        <Select
          label={translations.trainingSessions.labels.sessionStatus}
          aria-label={translations.trainingSessions.labels.sessionStatus}
          placeholder={translations.trainingSessions.placeholders.sessionStatus}
          selectedKeys={[selectedStatus]}
          onSelectionChange={(keys) => {
            const status = Array.from(keys)[0] as TrainingSessionStatusEnum;
            setSelectedStatus(status);
            if (status !== TrainingSessionStatusEnum.CANCELLED) {
              setCancellationReason('');
            }
          }}
        >
          {statusOptions.map((option) => (
            <SelectItem key={option.key} aria-label={option.label}>
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-gray-500">{option.description}</span>
              </div>
            </SelectItem>
          ))}
        </Select>

        {isCancellationReasonRequired && (
          <div className="space-y-2">
            <Textarea
              label={translations.trainingSessions.cancelTrainingSessionReason}
              placeholder={translations.trainingSessions.placeholders.cancelReason}
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              minRows={3}
              maxRows={6}
              isRequired
              className="w-full"
            />
            <Alert color={'warning'} title={translations.trainingSessions.alerts.sessionCanceled} />
          </div>
        )}
      </div>
    </UnifiedModal>
  );
}

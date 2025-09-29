'use client';

import React, {useState} from 'react';

import {Select, SelectItem, Textarea, Card, CardBody} from '@heroui/react';

import {UnifiedModal} from '@/components';
import {TrainingSessionStatus} from '@/types';

interface TrainingSessionStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: TrainingSessionStatus, reason?: string) => void;
  currentStatus: TrainingSessionStatus;
  sessionTitle: string;
}

const statusOptions = [
  {
    key: 'planned',
    label: 'Naplánován',
    description: 'Trénink je naplánován a čeká na provedení',
    color: 'default',
  },
  {
    key: 'done',
    label: 'Proveden',
    description: 'Trénink byl úspěšně proveden',
    color: 'success',
  },
  {
    key: 'cancelled',
    label: 'Zrušen',
    description: 'Trénink byl zrušen',
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
  const [selectedStatus, setSelectedStatus] = useState<TrainingSessionStatus>(currentStatus);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (selectedStatus === 'cancelled' && !cancellationReason.trim()) {
      return; // Don't allow cancellation without reason
    }

    setIsSubmitting(true);
    try {
      await onConfirm(
        selectedStatus,
        selectedStatus === 'cancelled' ? cancellationReason : undefined
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

  const isCancellationReasonRequired = selectedStatus === 'cancelled';
  const canConfirm = !isCancellationReasonRequired || cancellationReason.trim().length > 0;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Změnit stav tréninku"
      size="md"
      isFooterWithActions
      onPress={handleConfirm}
      isDisabled={!canConfirm || isSubmitting}
    >
      <div className="space-y-4">
        <Select
          label="Stav tréninku"
          aria-label="Stav tréninku"
          placeholder="Vyberte stav"
          selectedKeys={[selectedStatus]}
          onSelectionChange={(keys) => {
            const status = Array.from(keys)[0] as TrainingSessionStatus;
            setSelectedStatus(status);
            if (status !== 'cancelled') {
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
          <Card className="border-red-200 bg-red-50">
            <CardBody className="p-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-red-800">Důvod zrušení *</label>
                <Textarea
                  placeholder="Zadejte důvod zrušení tréninku..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  minRows={3}
                  maxRows={6}
                  className="w-full"
                />
                <p className="text-xs text-red-600">
                  Při zrušení tréninku budou všichni členové automaticky označeni jako nepřítomní.
                </p>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </UnifiedModal>
  );
}

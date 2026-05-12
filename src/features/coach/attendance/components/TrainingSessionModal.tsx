'use client';

import {useEffect, useMemo, useState} from 'react';

import {Button, Input, Textarea} from '@heroui/react';

import {translations} from '@/lib/translations/index';

import {useUser} from '@/contexts/UserContext';

import {UnifiedModal} from '@/components';
import {TrainingSessionStatusEnum} from '@/enums';
import {BaseTrainingSession, TrainingSessionFormData} from '@/types';

interface TrainingSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: TrainingSessionFormData) => void;
  session?: BaseTrainingSession | null;
  selectedCategoryId: string;
  selectedSeason: string;
}

export default function TrainingSessionModal({
  isOpen,
  onClose,
  onSubmit,
  session,
  selectedCategoryId,
  selectedSeason,
}: TrainingSessionModalProps) {
  // Get current user's ID for coach_id field
  const {user} = useUser();
  const currentUserId = user?.id ?? '';

  // Memoize initial form data to include current user's ID
  // This ensures coach_id is set correctly when creating new sessions
  const initialFormData = useMemo<TrainingSessionFormData>(
    () => ({
      title: '',
      description: '',
      session_date: '',
      session_time: '',
      category_id: selectedCategoryId,
      season_id: selectedSeason,
      location: '',
      status: TrainingSessionStatusEnum.PLANNED,
      coach_id: currentUserId, // Use current user's ID instead of empty string
      status_reason: null,
    }),
    [selectedCategoryId, selectedSeason, currentUserId]
  );

  const [sessionFormData, setSessionFormData] = useState<TrainingSessionFormData>(initialFormData);

  // Update form data when session prop changes (for editing)
  useEffect(() => {
    if (session) {
      // Editing existing session - use session's coach_id
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessionFormData({
        title: session.title,
        description: session.description || '',
        session_date: session.session_date,
        session_time: session.session_time || '',
        category_id: session.category_id,
        season_id: session.season_id,
        location: session.location || '',
        status: session.status,
        coach_id: session.coach_id,
        status_reason: session.status_reason || null,
      });
    } else {
      // Reset form for new session - use current user's ID
      setSessionFormData(initialFormData);
    }
  }, [session, initialFormData]);

  // Reset form when modal opens for new session
  useEffect(() => {
    if (isOpen && !session) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessionFormData(initialFormData);
    }
  }, [isOpen, session, initialFormData]);

  const handleSubmit = () => {
    onSubmit(sessionFormData);
  };

  const handleClose = () => {
    // Reset form when closing
    setSessionFormData(initialFormData);
    onClose();
  };

  const modalTitle = session
    ? translations.attendance.modal.title.editSession
    : translations.attendance.modal.title.addSession;

  const footer = (
    <>
      <Button variant="light" onPress={handleClose}>
        {translations.common.actions.cancel}
      </Button>
      <Button
        color="primary"
        onPress={handleSubmit}
        isDisabled={!sessionFormData.title || !sessionFormData.session_date}
      >
        {session ? translations.common.actions.save : translations.common.actions.create}
      </Button>
    </>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      footer={footer}
      size={'2xl'}
    >
      <div className="space-y-4">
        <Input
          label={translations.trainingSessions.labels.title}
          placeholder={translations.trainingSessions.placeholders.title}
          value={sessionFormData.title}
          onChange={(e) =>
            setSessionFormData((prev) => ({
              ...prev,
              title: e.target.value,
            }))
          }
          isRequired
        />

        <Textarea
          label={translations.trainingSessions.labels.description}
          placeholder={translations.trainingSessions.placeholders.description}
          value={sessionFormData.description || ''}
          onChange={(e) =>
            setSessionFormData((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={translations.trainingSessions.labels.date}
            type="date"
            value={sessionFormData.session_date}
            onChange={(e) =>
              setSessionFormData((prev) => ({
                ...prev,
                session_date: e.target.value,
              }))
            }
            isRequired
          />

          <Input
            label={translations.trainingSessions.labels.time}
            type="time"
            value={sessionFormData.session_time || ''}
            onChange={(e) =>
              setSessionFormData((prev) => ({
                ...prev,
                session_time: e.target.value,
              }))
            }
          />
        </div>

        <Input
          label={translations.trainingSessions.labels.location}
          placeholder={translations.trainingSessions.placeholders.location}
          value={sessionFormData.location || ''}
          onChange={(e) =>
            setSessionFormData((prev) => ({
              ...prev,
              location: e.target.value,
            }))
          }
        />
      </div>
    </UnifiedModal>
  );
}

'use client';

import React, {useRef} from 'react';
import {DocumentTextIcon, PlusIcon} from '@heroicons/react/24/outline';
import {Button} from '@heroui/react';
import {AdminContainer} from '../../../components/admin/AdminContainer';
import {translations} from '@/lib/translations';
import {MeetingMinutesContainer, MeetingMinutesContainerRef} from '@/components';

export default function MeetingMinutesPage() {
  const t = translations.components.meetingMinutes;
  const containerRef = useRef<MeetingMinutesContainerRef>(null);

  return (
    <AdminContainer
      title={t.title}
      description={t.description}
      icon={<DocumentTextIcon className="w-8 h-8 text-blue-600" />}
      actions={
        <Button
          color="primary"
          startContent={<PlusIcon className="w-5 h-5" />}
          onPress={() => containerRef.current?.openCreateModal()}
        >
          {t.addMeetingMinutes}
        </Button>
      }
    >
      <MeetingMinutesContainer ref={containerRef} />
    </AdminContainer>
  );
}

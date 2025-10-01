'use client';

import React, {useRef} from 'react';

import {MeetingMinutesContainer} from '@/components/features';
import {AdminContainer} from '@/components/features/admin/AdminContainer';

import {translations} from '@/lib/translations';

import {ActionTypes} from '@/enums';
import {MeetingMinutesContainerRef} from '@/types';

export default function MeetingMinutesPage() {
  const t = translations.components.meetingMinutes;
  const containerRef = useRef<MeetingMinutesContainerRef>(null);

  return (
    <AdminContainer
      actions={[
        {
          label: t.addMeetingMinutes,
          onClick: () => containerRef.current?.openCreateModal(),
          variant: 'solid',
          buttonType: ActionTypes.CREATE,
        },
      ]}
    >
      <MeetingMinutesContainer ref={containerRef} />
    </AdminContainer>
  );
}

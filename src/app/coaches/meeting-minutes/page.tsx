'use client';

import React from 'react';

import {DocumentTextIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {MeetingMinutesContainer, PageContainer} from '@/components';

export default function CoachMeetingMinutesPage() {
  const t = translations.components.meetingMinutes;

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <DocumentTextIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        </div>
        <p className="text-gray-600">{t.description}</p>
      </div>

      <MeetingMinutesContainer />
    </PageContainer>
  );
}

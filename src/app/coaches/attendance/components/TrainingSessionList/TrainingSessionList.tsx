'use client';

import React, {useMemo, useState} from 'react';

import {Tab, Tabs} from '@heroui/react';

import {translations} from '@/lib/translations/index';

import {UnifiedCard} from '@/components';
import {BaseTrainingSession} from '@/types';
import {isEmpty} from '@/utils';

import {TrainingSessionCard} from './components/TrainingSessionCard';
import {segmentSessions, SessionSegment} from './utils/segmentSessions';

interface TrainingSessionListProps {
  loading: boolean;
  sessions: BaseTrainingSession[];
  selectedSession: string | null;
  onStatusChange: (session: BaseTrainingSession) => void;
  onSelectedSession: (sessionId: string | null) => void;
  onEditSession: (session: BaseTrainingSession) => void;
  onDeleteSession: (sessionId: string) => void;
}

interface SessionTab {
  id: SessionSegment;
  label: string;
  sessions: BaseTrainingSession[];
}

export const TrainingSessionList = ({
  loading,
  sessions,
  selectedSession,
  onStatusChange,
  onSelectedSession,
  onDeleteSession,
  onEditSession,
}: TrainingSessionListProps) => {
  const [activeSegment, setActiveSegment] = useState<SessionSegment>('upcoming');

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const segments = useMemo(() => segmentSessions(sessions, today), [sessions, today]);

  const tabs: SessionTab[] = useMemo(
    () => [
      {
        id: 'upcoming',
        label: `${translations.trainingSessions.tabs.upcoming} (${segments.upcoming.length})`,
        sessions: segments.upcoming,
      },
      {
        id: 'past',
        label: `${translations.trainingSessions.tabs.past} (${segments.past.length})`,
        sessions: segments.past,
      },
      {
        id: 'all',
        label: `${translations.trainingSessions.tabs.all} (${segments.all.length})`,
        sessions: segments.all,
      },
    ],
    [segments]
  );

  return (
    <div className="lg:col-span-1">
      <UnifiedCard title={translations.trainingSessions.title} isLoading={loading}>
        <Tabs
          selectedKey={activeSegment}
          onSelectionChange={(key) => setActiveSegment(key as SessionSegment)}
          aria-label={translations.trainingSessions.title}
          items={tabs}
          size="sm"
        >
          {(tab) => (
            <Tab key={tab.id} title={tab.label}>
              <div className="space-y-2">
                {isEmpty(tab.sessions) ? (
                  <div className="text-center text-gray-500 py-10">
                    {translations.trainingSessions.noTrainingSessionsFound}
                  </div>
                ) : (
                  tab.sessions.map((session) => (
                    <TrainingSessionCard
                      key={session.id}
                      session={session}
                      isToday={session.session_date === today}
                      selectedSession={selectedSession}
                      onSelectedSession={onSelectedSession}
                      onStatusChange={onStatusChange}
                      onEditSession={onEditSession}
                      onDeleteSession={onDeleteSession}
                    />
                  ))
                )}
              </div>
            </Tab>
          )}
        </Tabs>
      </UnifiedCard>
    </div>
  );
};

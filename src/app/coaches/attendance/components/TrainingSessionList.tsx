import React from 'react';

import {Button, Card, CardBody, CardHeader, Skeleton} from '@heroui/react';

import {CalendarIcon, PencilIcon, TrashIcon} from '@heroicons/react/24/outline';

import TrainingSessionStatusBadge from '@/app/coaches/attendance/components/TrainingSessionStatusBadge';

import {Heading} from '@/components';
import {TrainingSessionStatusEnum} from '@/enums';
import {formatDateString, formatTime} from '@/helpers';
import {translations} from '@/lib';
import {BaseTrainingSession} from '@/types';

interface TrainingSessionListProps {
  loading: boolean;
  sessions: BaseTrainingSession[];
  selectedSession: string | null;
  onStatusChnage: (session: BaseTrainingSession) => void;
  onSelectedSession: (sessionId: string | null) => void;
  onEditSession: (session: BaseTrainingSession) => void;
  onDeleteSession: (sessionId: string) => void;
}

const t = translations.coachPortal.trainingSessions.trainingSessionList;

export const TrainingSessionList = ({
  loading,
  sessions,
  selectedSession,
  onStatusChnage,
  onSelectedSession,
  onDeleteSession,
  onEditSession,
}: TrainingSessionListProps) => {
  return (
    <div className="lg:col-span-1">
      <Card>
        <CardHeader>
          <Heading size={3}>{t.title}</Heading>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">{t.noTrainingSession}</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => {
                const isButtonDisabled =
                  session.status === TrainingSessionStatusEnum.CANCELLED ||
                  session.status === TrainingSessionStatusEnum.DONE;
                return (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSession === session.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => onSelectedSession(session.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Heading size={4}>{session.title}</Heading>
                          <TrainingSessionStatusBadge
                            status={session.status || TrainingSessionStatusEnum.PLANNED}
                            size="sm"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <div>{formatDateString(session.session_date)}</div>
                          {session.session_time && <div>{formatTime(session.session_time)}</div>}
                        </div>
                        {session.location && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            {session.location}
                          </div>
                        )}
                        {session.description && (
                          <div className="flex items-start gap-1 text-xs text-gray-500 mt-1">
                            <span className="font-semibold">{t.trainingSessionDescription}</span>
                            {session.description}
                          </div>
                        )}
                        {session.status === TrainingSessionStatusEnum.CANCELLED &&
                          session.status_reason && (
                            <div className="flex items-start gap-1 text-xs text-red-600 mt-1">
                              <span className="font-semibold">{t.cancelTrainingSessionReason}</span>
                              {session.status_reason}
                            </div>
                          )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="light"
                          color="primary"
                          onPress={() => onStatusChnage(session)}
                          isIconOnly
                          aria-label={`${t.changeTrainingSessionStatus} ${session.title}`}
                          startContent={<CalendarIcon className="w-4 h-4" />}
                          isDisabled={isButtonDisabled}
                        />
                        <Button
                          size="sm"
                          variant="light"
                          startContent={<PencilIcon className="w-4 h-4" />}
                          isIconOnly
                          aria-label={`${t.updateTrainingSession} ${session.title}`}
                          onPress={() => onEditSession(session)}
                        />
                        <Button
                          size="sm"
                          color="danger"
                          variant="light"
                          onPress={() => onDeleteSession(session.id)}
                          isIconOnly
                          aria-label={`${t.deleteTrainingSession}  ${session.title}`}
                          startContent={<TrashIcon className="w-4 h-4" />}
                          isDisabled={isButtonDisabled}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

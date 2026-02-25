'use client';

import React, {useState} from 'react';

import {
  Button,
  Card,
  CardBody,
  Checkbox,
  CheckboxGroup,
  Divider,
  Input,
  TimeInput,
} from '@heroui/react';

import {CalendarIcon, ClockIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations/index';

import {UnifiedModal} from '@/components';
import {useUser} from '@/contexts';
import {TrainingSessionStatusEnum} from '@/enums';
import {formatDateString, formatTime, generateSessionDates, WEEKDAY_MAP} from '@/helpers';
import {useBulkCreateTrainingSessions} from '@/hooks';
import {TrainingSessionInsert} from '@/types';
import {hasItems, isEmpty} from '@/utils';

interface TrainingSessionGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedCategory: string;
  selectedSeason: string;
  memberIds: string[];
}

interface GeneratedSession {
  date: string;
  time: string;
  title: string;
  category_id: string;
}

const DEFAULT_TITLE_TEMPLATE = translations.trainingSessions.titleShort;

export default function TrainingSessionGenerator({
  isOpen,
  onClose,
  onSuccess,
  selectedCategory,
  selectedSeason,
  memberIds,
}: TrainingSessionGeneratorProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [trainingTime, setTrainingTime] = useState('');
  const [titleTemplate, setTitleTemplate] = useState(DEFAULT_TITLE_TEMPLATE);
  const [includeNumber, setIncludeNumber] = useState(false);
  const [generatedSessions, setGeneratedSessions] = useState<GeneratedSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createAttendanceRecords, setCreateAttendanceRecords] = useState(true);

  const {user} = useUser();
  const {bulkCreate, loading: bulkLoading} = useBulkCreateTrainingSessions();

  // Days of the week options
  const dayOptions = [
    {value: 'monday', label: translations.common.labels.weekDays.monday},
    {value: 'tuesday', label: translations.common.labels.weekDays.tuesday},
    {value: 'wednesday', label: translations.common.labels.weekDays.wednesday},
    {value: 'thursday', label: translations.common.labels.weekDays.thursday},
    {value: 'friday', label: translations.common.labels.weekDays.friday},
    {value: 'saturday', label: translations.common.labels.weekDays.saturday},
    {value: 'sunday', label: translations.common.labels.weekDays.sunday},
  ];

  const isGenerateDisabled = !dateFrom || !dateTo || isEmpty(selectedDays) || !trainingTime;

  const generateSessions = () => {
    if (isGenerateDisabled) {
      setError(translations.trainingSessions.responseMessages.mandatoryFieldsMissing);
      return;
    }

    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);

    if (startDate >= endDate) {
      setError(translations.common.responseMessages.dateFromAfterDateTo);
      return;
    }

    const dates = generateSessionDates(startDate, endDate, selectedDays);

    const sessions: GeneratedSession[] = dates.map((date, index) => ({
      date,
      time: trainingTime,
      title: includeNumber ? `${titleTemplate} ${index + 1}` : titleTemplate,
      category_id: selectedCategory,
    }));

    setGeneratedSessions(sessions);
    setError(null);
  };

  const createAllSessions = async () => {
    if (isEmpty(generatedSessions)) return;

    const sessionToCreate: TrainingSessionInsert[] = generatedSessions.map((session) => ({
      title: session.title,
      session_date: session.date,
      session_time: session.time,
      category_id: session.category_id,
      season_id: selectedSeason,
      coach_id: user?.id || '',
      status: TrainingSessionStatusEnum.PLANNED,
      description: null,
      location: null,
      status_reason: null,
    }));

    const attendanceMemberIds = createAttendanceRecords ? memberIds : [];

    const result = await bulkCreate(sessionToCreate, attendanceMemberIds);

    if (result) {
      resetForm();
      onSuccess();
      onClose();
    }
  };

  // Reset form
  const resetForm = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedDays([]);
    setTrainingTime('');
    setTitleTemplate(DEFAULT_TITLE_TEMPLATE);
    setIncludeNumber(false);
    setGeneratedSessions([]);
    setError(null);
    setCreateAttendanceRecords(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const footer = (
    <>
      <Button color="danger" variant="light" onPress={handleClose}>
        {translations.common.actions.cancel}
      </Button>
      {generatedSessions.length > 0 && (
        <Button
          color="primary"
          onPress={createAllSessions}
          isLoading={bulkLoading}
          isDisabled={bulkLoading}
        >
          {translations.common.actions.create}
        </Button>
      )}
    </>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={translations.trainingSessions.trainingSessionGenerator}
      size="2xl"
      scrollBehavior="inside"
      footer={footer}
    >
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2  gap-2 md:gap-4">
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          startContent={<CalendarIcon className="w-4 h-4 text-gray-400" />}
          label={translations.common.labels.dateFrom}
          isRequired
          aria-label={translations.common.labels.dateFrom}
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          startContent={<CalendarIcon className="w-4 h-4 text-gray-400" />}
          label={translations.common.labels.dateTo}
          isRequired
          aria-label={translations.common.labels.dateTo}
        />
      </div>

      <div>
        <CheckboxGroup
          label={translations.common.labels.weekDaysTitle}
          orientation="horizontal"
          value={selectedDays}
          onValueChange={(values) => setSelectedDays(values as string[])}
        >
          {dayOptions.map((day) => (
            <Checkbox key={day.value} value={day.value}>
              {day.label}
            </Checkbox>
          ))}
        </CheckboxGroup>
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-4">
        <TimeInput
          onChange={(e) => setTrainingTime(e?.toString() || '')}
          label={translations.trainingSessions.trainingSessionTime}
          isRequired
          hourCycle={24}
          aria-label={translations.trainingSessions.trainingSessionTime}
          startContent={<ClockIcon className="w-4 h-4 text-gray-400" />}
        />
      </div>

      <div>
        <Input
          value={titleTemplate}
          onChange={(e) => setTitleTemplate(e.target.value)}
          placeholder={translations.trainingSessions.placeholders.title}
          label={translations.trainingSessions.labels.title}
          isRequired
          aria-label={translations.trainingSessions.labels.title}
        />
        <div className="mt-2">
          <Checkbox
            isSelected={includeNumber}
            onValueChange={setIncludeNumber}
            aria-label={translations.trainingSessions.ariaLabel.numberInSessionTitle}
          >
            {translations.trainingSessions.labels.numberInSessionTitle}
          </Checkbox>
        </div>
      </div>

      <div>
        <Checkbox
          isSelected={createAttendanceRecords}
          onValueChange={setCreateAttendanceRecords}
          aria-label={translations.trainingSessions.ariaLabel.automaticTrainingSessionStatus}
        >
          {translations.trainingSessions.labels.automaticTrainingSessionStatus}
        </Checkbox>
        <p className="text-sm text-gray-600 mt-1">
          {translations.trainingSessions.placeholders.automaticTrainingSessionStatus}
        </p>
      </div>

      <div className="flex justify-center pt-4">
        <Button color="primary" onPress={generateSessions} isDisabled={isGenerateDisabled}>
          {translations.trainingSessions.actions.preview}
        </Button>
      </div>

      {/* Generated Sessions Preview */}
      {hasItems(generatedSessions) && (
        <>
          <Divider className="my-4" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {translations.trainingSessions.labels.preview} ({generatedSessions.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto p-2">
              {generatedSessions.map((session, index) => (
                <Card key={index} className="p-3">
                  <CardBody className="p-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{session.title}</p>
                        <p className="text-sm text-gray-600">
                          {formatDateString(session.date)} v {formatTime(session.time)}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {
                          dayOptions.find(
                            (d) =>
                              d.value ===
                              Object.keys(WEEKDAY_MAP).find(
                                (day) => WEEKDAY_MAP[day] === new Date(session.date).getDay()
                              )
                          )?.label
                        }
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </UnifiedModal>
  );
}

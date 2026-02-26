'use client';

import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {Button, Select, SelectItem, Tab, Tabs} from '@heroui/react';

import {CalendarIcon, PlusIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations/index';

import {hasItems, hasMoreThanOne} from '@/utils/arrayHelper';

import {useAppData} from '@/contexts/AppDataContext';

import {useCoachCategory} from '@/app/coaches/components/CoachCategoryContext';

import {DeleteConfirmationModal, PageContainer, showToast, UnifiedCard} from '@/components';
import {
  ATTENDANCE_TABS_LABELS,
  AttendanceStatuses,
  AttendanceTabs,
  TrainingSessionStatusEnum,
} from '@/enums';
import {
  useAttendance,
  useFetchCategoryLineupMembers,
  useFetchCategoryLineups,
  useFetchMembersAttendance,
  useFetchTrainingSessions,
  useModal,
  useModalWithItem,
  useTrainingSession,
} from '@/hooks';
import {BaseTrainingSession, TrainingSessionFormData} from '@/types';

import {
  AttendanceRecordingTable,
  AttendanceStatisticsLazy,
  TrainingSessionGenerator,
  TrainingSessionList,
  TrainingSessionModal,
  TrainingSessionStatusDialog,
} from './components';

export const dynamic = 'force-dynamic';

export default function CoachesAttendancePage() {
  const {
    availableCategories,
    selectedCategory,
    setSelectedCategory,
    selectedSeason,
    setSelectedSeason,
    isLoading,
  } = useCoachCategory();

  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AttendanceTabs>(AttendanceTabs.ATTENDANCE);

  const sessionModal = useModalWithItem<BaseTrainingSession>();
  const deleteModal = useModalWithItem<string>();
  const statusDialog = useModalWithItem<BaseTrainingSession>();
  const generatorModal = useModal();

  const {loading, updateTrainingSessionStatus, recordAttendance, createAttendanceForLineupMembers} =
    useAttendance();

  const {
    createTrainingSession,
    updateTrainingSession,
    deleteTrainingSession,
    loading: loadingCrudOperations,
  } = useTrainingSession();

  const {
    seasons: {data: seasons},
    members: {data: members},
    loading: appDataLoading,
  } = useAppData();

  const {
    data: sessions,
    loading: trainingSessionsLoading,
    refetch: refetchSessions,
  } = useFetchTrainingSessions({
    categoryId: selectedCategory,
    seasonId: selectedSeason,
  });

  const selectedSessionData = useMemo(
    () => sessions.find((s) => s.id === selectedSession) ?? null,
    [sessions, selectedSession]
  );

  const {
    data: attendanceRecords,
    loading: attendanceLoading,
    refetch: fetchAttendanceRecords,
  } = useFetchMembersAttendance({
    trainingSessionId: selectedSession || '',
  });

  // Fetch category lineups to get the active lineup ID
  const {data: lineups, refetch: fetchLineups} = useFetchCategoryLineups({
    categoryId: selectedCategory,
    seasonId: selectedSeason,
  });

  // Find the active lineup for this category/season
  // Note: useFetchCategoryLineupMembers requires a lineup ID, not a session ID
  const activeLineup = useMemo(() => {
    return lineups?.find((lineup) => lineup.is_active) ?? null;
  }, [lineups]);

  // Fetch lineup members using the correct lineup ID (not session ID!)
  const {data: lineupMembers} = useFetchCategoryLineupMembers(
    selectedCategory,
    activeLineup?.category_id === selectedCategory ? activeLineup.id : ''
  );

  const resolveMemberIds = useCallback((): string[] => {
    const fromLineup = lineupMembers
      .map((lm) => lm.members?.id)
      .filter((id): id is string => Boolean(id));

    if (hasItems(fromLineup)) return fromLineup;

    return members.filter((m) => m.category_id === selectedCategory).map((m) => m.id);
  }, [lineupMembers, members, selectedCategory]);

  // Fetch attendance records when session changes
  useEffect(() => {
    if (selectedSession) {
      void fetchAttendanceRecords();
    }
  }, [selectedSession, fetchAttendanceRecords]);

  const handleSessionSubmit = async (sessionData: TrainingSessionFormData) => {
    try {
      // Use category ID directly
      const dataWithCategory = {
        ...sessionData,
        category_id: selectedCategory,
        season_id: selectedSeason,
      };

      if (sessionModal.selectedItem) {
        await updateTrainingSession(sessionModal.selectedItem.id, dataWithCategory);
        await refetchSessions();
      } else {
        // Create new training session
        const createdSession = await createTrainingSession(dataWithCategory);
        await refetchSessions();

        // Check if session was created successfully
        if (!createdSession) {
          showToast.danger(translations.attendance.responseMessages.sessionWasNotCreated);
          return;
        }

        // Create attendance records for the new session
        try {
          const memberIds = resolveMemberIds();
          if (hasItems(memberIds)) {
            await createAttendanceForLineupMembers(
              createdSession.id,
              memberIds,
              AttendanceStatuses.PRESENT
            );
          }
        } catch (attendanceErr) {
          // Don't fail the session creation if attendance fails
        }
      }
      sessionModal.closeAndClear();
    } catch (err) {
      showToast.danger(
        `${translations.attendance.responseMessages.sessionSavingFailed} ${err instanceof Error ? err.message : ''}`
      );
    }
  };

  const confirmDeleteSession = async () => {
    if (!deleteModal.selectedItem) return;

    try {
      await deleteTrainingSession(deleteModal.selectedItem);
      if (selectedSession === deleteModal.selectedItem) {
        setSelectedSession('');
      }
      await refetchSessions();
      deleteModal.closeAndClear();
    } catch (err) {
      showToast.danger(
        `${translations.attendance.responseMessages.sessionDeletionFailed} ${err instanceof Error ? err.message : ''}`
      );
    }
  };

  const handleStatusUpdate = async (status: TrainingSessionStatusEnum, reason?: string) => {
    if (!statusDialog.selectedItem) return;

    try {
      await updateTrainingSessionStatus(statusDialog.selectedItem.id, status, reason);
    } catch (err) {
      showToast.danger(
        `${translations.attendance.responseMessages.sessionStateUpdateFailed}: ${err}`
      );
    }
  };

  const handleRecordAttendance = async (memberId: string, status: AttendanceStatuses) => {
    if (!selectedSession) return;

    try {
      await recordAttendance(memberId, selectedSession, status);
      await fetchAttendanceRecords();
    } catch (err) {
      showToast.danger(
        `${translations.attendance.responseMessages.attendanceCreationFailed} ${err instanceof Error ? err.message : ''}`
      );
    }
  };

  const handleCreateAttendanceForSession = async () => {
    if (!selectedSession || !selectedCategory || !selectedSeason) return;

    try {
      // Get lineup members for the selected category and season
      await fetchLineups();
      const memberIds = resolveMemberIds();
      if (hasItems(memberIds)) {
        await createAttendanceForLineupMembers(
          selectedSession,
          memberIds,
          AttendanceStatuses.PRESENT
        );
      }

      await fetchAttendanceRecords();

      showToast.success(
        translations.attendance.responseMessages.attendanceRecordsCreated(memberIds.length)
      );
    } catch (err) {
      showToast.danger(
        `${translations.attendance.responseMessages.sessionCreationFailed} ${err instanceof Error ? err.message : ''}`
      );
    }
  };

  const isAllLoadings = loading || appDataLoading || trainingSessionsLoading || isLoading;

  return (
    <>
      <PageContainer isLoading={isAllLoadings}>
        <UnifiedCard padding={'none'}>
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
            <div className="flex flex-col md:flex-row items-stretch sm:items-end gap-2 flex-1 lg:w-auto">
              {hasMoreThanOne(availableCategories) ? (
                <Select
                  label={translations.categories.labels.category}
                  placeholder={translations.categories.placeholders.category}
                  selectedKeys={selectedCategory ? [selectedCategory] : []}
                  onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
                  isDisabled={appDataLoading}
                  defaultSelectedKeys={selectedCategory ? [selectedCategory] : []}
                  className="min-w-0 w-56"
                >
                  {availableCategories.map((category) => (
                    <SelectItem key={category.id}>{category.name}</SelectItem>
                  ))}
                </Select>
              ) : null}
              <Select
                label={translations.seasons.labels.season}
                placeholder={translations.seasons.placeholders.season}
                selectedKeys={selectedSeason ? [selectedSeason] : []}
                onSelectionChange={(keys) => setSelectedSeason(Array.from(keys)[0] as string)}
                isDisabled={appDataLoading}
                className="min-w-0 w-56"
              >
                {seasons.map((season) => (
                  <SelectItem key={season.id}>{season.name}</SelectItem>
                ))}
              </Select>
            </div>

            <div className="flex items-stretch sm:items-end gap-2">
              <Button
                color="primary"
                startContent={<PlusIcon className="w-4 h-4" />}
                onPress={sessionModal.openEmpty}
                isDisabled={!selectedCategory || !selectedSeason}
                className="w-full sm:w-auto"
              >
                <span className="hidden sm:inline">
                  {translations.attendance.labels.newSession}
                </span>
              </Button>
              <Button
                color="primary"
                variant="bordered"
                onPress={generatorModal.onOpen}
                isDisabled={!selectedCategory || !selectedSeason}
                isIconOnly
                aria-label={translations.attendance.ariaLabels.sessionGeneration}
                className="w-full sm:w-auto"
              >
                <CalendarIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </UnifiedCard>

        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as AttendanceTabs)}
          size="md"
        >
          <Tab
            key={AttendanceTabs.ATTENDANCE}
            title={ATTENDANCE_TABS_LABELS[AttendanceTabs.ATTENDANCE]}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <TrainingSessionList
                sessions={sessions}
                selectedSession={selectedSession}
                onSelectedSession={setSelectedSession}
                onStatusChange={statusDialog.openWith}
                onEditSession={sessionModal.openWith}
                onDeleteSession={deleteModal.openWith}
                loading={trainingSessionsLoading}
              />

              <AttendanceRecordingTable
                attendanceRecords={attendanceRecords}
                selectedSession={selectedSession}
                handleRecordAttendance={handleRecordAttendance}
                handleCreateAttendanceForSession={handleCreateAttendanceForSession}
                loading={attendanceLoading}
                selectedSessionData={selectedSessionData}
              />
            </div>
          </Tab>
          <Tab
            key={AttendanceTabs.STATISTICS}
            title={ATTENDANCE_TABS_LABELS[AttendanceTabs.STATISTICS]}
          >
            {activeTab === AttendanceTabs.STATISTICS && selectedCategory && selectedSeason && (
              <AttendanceStatisticsLazy categoryId={selectedCategory} seasonId={selectedSeason} />
            )}
            {activeTab === AttendanceTabs.STATISTICS && (!selectedCategory || !selectedSeason) && (
              <UnifiedCard>
                <p className="text-center text-gray-500">
                  {translations.attendance.responseMessages.selectSeasonAndCategory}
                </p>
              </UnifiedCard>
            )}
          </Tab>
        </Tabs>
      </PageContainer>

      <TrainingSessionModal
        isOpen={sessionModal.isOpen}
        onClose={sessionModal.closeAndClear}
        onSubmit={handleSessionSubmit}
        session={sessionModal.selectedItem}
        selectedCategoryId={selectedCategory}
        selectedSeason={selectedSeason}
      />

      <TrainingSessionGenerator
        isOpen={generatorModal.isOpen}
        onClose={generatorModal.onClose}
        selectedCategory={selectedCategory}
        selectedSeason={selectedSeason}
        memberIds={resolveMemberIds()}
        onSuccess={() => {
          void refetchSessions();
        }}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeAndClear}
        onConfirm={confirmDeleteSession}
        title={translations.attendance.modal.title.deleteSession}
        message={translations.attendance.modal.description.deleteSession}
        isLoading={loadingCrudOperations}
      />

      <TrainingSessionStatusDialog
        isOpen={statusDialog.isOpen}
        onClose={statusDialog.closeAndClear}
        onConfirm={handleStatusUpdate}
        currentStatus={statusDialog.selectedItem?.status || TrainingSessionStatusEnum.PLANNED}
        sessionTitle={statusDialog.selectedItem?.title || ''}
      />
    </>
  );
}

'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';

import {attendanceTabsLabels} from '@/enums/getAttendanceTabOptions';

import {translations} from '@/lib/translations';

import {hasItems} from '@/utils/arrayHelper';

import {useAppData} from '@/contexts/AppDataContext';

import {showToast} from '@/components';
import {AttendanceStatuses, AttendanceTabs, TrainingSessionStatusEnum} from '@/enums';
import {useCoachCategory} from '@/features/coach/providers/CategoryProvider';
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

export function useCoachAttendancePageLogic() {
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

  const {data: lineups, refetch: fetchLineups} = useFetchCategoryLineups({
    categoryId: selectedCategory,
    seasonId: selectedSeason,
  });

  const activeLineup = useMemo(
    () => lineups?.find((lineup) => lineup.is_active) ?? null,
    [lineups]
  );

  const lineupId = activeLineup?.category_id === selectedCategory ? activeLineup.id : '';
  const {data: lineupMembers} = useFetchCategoryLineupMembers({lineupId});

  const resolveMemberIds = useCallback((): string[] => {
    const fromLineup = lineupMembers
      .map((lm) => lm.members?.id)
      .filter((id): id is string => Boolean(id));

    if (hasItems(fromLineup)) return fromLineup;

    return members.filter((m) => m.category_id === selectedCategory).map((m) => m.id);
  }, [lineupMembers, members, selectedCategory]);

  useEffect(() => {
    if (selectedSession) {
      void fetchAttendanceRecords();
    }
  }, [selectedSession, fetchAttendanceRecords]);

  const handleSessionSubmit = async (sessionData: TrainingSessionFormData) => {
    try {
      const dataWithCategory = {
        ...sessionData,
        category_id: selectedCategory,
        season_id: selectedSeason,
      };

      if (sessionModal.selectedItem) {
        await updateTrainingSession(sessionModal.selectedItem.id, dataWithCategory);
        await refetchSessions();
      } else {
        const createdSession = await createTrainingSession(dataWithCategory);
        await refetchSessions();

        if (!createdSession) {
          showToast.danger(translations.attendance.responseMessages.sessionWasNotCreated);
          return;
        }

        try {
          const memberIds = resolveMemberIds();
          if (hasItems(memberIds)) {
            await createAttendanceForLineupMembers(
              createdSession.id,
              memberIds,
              AttendanceStatuses.PRESENT
            );
          }
        } catch {
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

  const tabLabels = attendanceTabsLabels();

  return {
    // Category / season
    availableCategories,
    selectedCategory,
    setSelectedCategory,
    selectedSeason,
    setSelectedSeason,
    isLoading,

    // Tabs
    activeTab,
    setActiveTab,
    tabLabels,

    // Session selection
    selectedSession,
    setSelectedSession,
    selectedSessionData,

    // Data
    sessions,
    attendanceRecords,
    trainingSessionsLoading,
    attendanceLoading,
    appDataLoading,
    isAllLoadings,

    // Modals
    sessionModal,
    deleteModal,
    statusDialog,
    generatorModal,
    loadingCrudOperations,

    // Handlers
    handleSessionSubmit,
    confirmDeleteSession,
    handleStatusUpdate,
    handleRecordAttendance,
    handleCreateAttendanceForSession,
    resolveMemberIds,
    refetchSessions,
  };
}

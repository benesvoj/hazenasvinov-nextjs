'use client';

import {Select, SelectItem} from '@heroui/react';

import {CalendarIcon, PlusIcon} from '@heroicons/react/24/outline';

import {attendanceTabsLabels} from '@/enums/getAttendanceTabOptions';

import {translations} from '@/lib/translations';

import {hasMoreThanOne} from '@/utils/arrayHelper';

import {useAppData} from '@/contexts/AppDataContext';

import {ContentCard, DeleteDialog, Grid, GridItem} from '@/components';
import {AttendanceTabs, TrainingSessionStatusEnum} from '@/enums';
import {AppPageLayout, FloatingActions} from '@/shared/components';

import {useCoachAttendancePageLogic} from '../hooks/useCoachAttendancePageLogic';

import {
  AttendanceRecordingPanel,
  AttendanceStatisticsLazy,
  AttendanceStatsCards,
  TrainingSessionGenerator,
  TrainingSessionList,
  TrainingSessionModal,
  TrainingSessionStatusDialog,
} from '.';

export default function CoachAttendanceContainer() {
  const state = useCoachAttendancePageLogic();
  const {
    seasons: {data: seasons},
  } = useAppData();

  const tabLabels = attendanceTabsLabels();

  return (
    <>
      <AppPageLayout
        isLoading={state.isAllLoadings}
        header={
          <ContentCard padding="none">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
              <div className="flex flex-col md:flex-row items-stretch sm:items-end gap-2 flex-1 lg:w-auto">
                {hasMoreThanOne(state.availableCategories) ? (
                  <Select
                    label={translations.categories.labels.category}
                    placeholder={translations.categories.placeholders.category}
                    selectedKeys={state.selectedCategory ? [state.selectedCategory] : []}
                    onSelectionChange={(keys) =>
                      state.setSelectedCategory(Array.from(keys)[0] as string)
                    }
                    isDisabled={state.appDataLoading}
                    defaultSelectedKeys={state.selectedCategory ? [state.selectedCategory] : []}
                    className="min-w-0 w-56"
                  >
                    {state.availableCategories.map((category) => (
                      <SelectItem key={category.id}>{category.name}</SelectItem>
                    ))}
                  </Select>
                ) : null}
                <Select
                  label={translations.seasons.labels.season}
                  placeholder={translations.seasons.placeholders.season}
                  selectedKeys={state.selectedSeason ? [state.selectedSeason] : []}
                  onSelectionChange={(keys) =>
                    state.setSelectedSeason(Array.from(keys)[0] as string)
                  }
                  isDisabled={state.appDataLoading}
                  className="min-w-0 w-56"
                >
                  {seasons.map((season) => (
                    <SelectItem key={season.id}>{season.name}</SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          </ContentCard>
        }
        floatingActions={
          <FloatingActions
            actions={[
              {
                label: translations.attendance.labels.newSession,
                icon: <PlusIcon className="w-5 h-5" />,
                onClick: state.sessionModal.openEmpty,
              },
              {
                label: translations.attendance.ariaLabels.sessionGeneration,
                icon: <CalendarIcon className="w-5 h-5" />,
                onClick: state.generatorModal.onOpen,
              },
            ]}
          />
        }
        tabs={[
          {
            key: AttendanceTabs.ATTENDANCE,
            title: tabLabels[AttendanceTabs.ATTENDANCE],
            content: (
              <div className="flex flex-col gap-4">
                {/* Stats row */}
                <AttendanceStatsCards
                  sessions={state.sessions}
                  statistics={state.attendanceStatistics}
                  isLoading={state.statsLoading}
                />

                {/* Two-column layout */}
                <Grid columns={3}>
                  <GridItem span={1}>
                    <TrainingSessionList
                      sessions={state.sessions}
                      selectedSession={state.selectedSession}
                      onSelectedSession={state.setSelectedSession}
                      onStatusChange={state.statusDialog.openWith}
                      onEditSession={state.sessionModal.openWith}
                      onDeleteSession={state.deleteModal.openWith}
                      loading={state.trainingSessionsLoading}
                    />
                  </GridItem>
                  <GridItem span={2}>
                    <AttendanceRecordingPanel
                      attendanceRecords={state.attendanceRecords}
                      selectedSession={state.selectedSession}
                      selectedSessionData={state.selectedSessionData}
                      loading={state.attendanceLoading}
                      memberHistory={state.memberHistory}
                      onRecordAttendance={state.handleRecordAttendance}
                      onBulkUpdate={state.handleBulkUpdate}
                      onEditSession={state.sessionModal.openWith}
                      onDeleteSession={state.deleteModal.openWith}
                    />
                  </GridItem>
                </Grid>
              </div>
            ),
          },
          {
            key: AttendanceTabs.STATISTICS,
            title: tabLabels[AttendanceTabs.STATISTICS],
            content:
              state.activeTab === AttendanceTabs.STATISTICS &&
              state.selectedCategory &&
              state.selectedSeason ? (
                <AttendanceStatisticsLazy
                  categoryId={state.selectedCategory}
                  seasonId={state.selectedSeason}
                />
              ) : state.activeTab === AttendanceTabs.STATISTICS ? (
                <ContentCard>
                  <p className="text-center text-gray-500">
                    {translations.attendance.responseMessages.selectSeasonAndCategory}
                  </p>
                </ContentCard>
              ) : null,
          },
        ]}
        activeTab={state.activeTab}
        onTabChange={(key) => state.setActiveTab(key as AttendanceTabs)}
      />

      <TrainingSessionModal
        isOpen={state.sessionModal.isOpen}
        onClose={state.sessionModal.closeAndClear}
        onSubmit={state.handleSessionSubmit}
        session={state.sessionModal.selectedItem}
        selectedCategoryId={state.selectedCategory}
        selectedSeason={state.selectedSeason}
      />

      <TrainingSessionGenerator
        isOpen={state.generatorModal.isOpen}
        onClose={state.generatorModal.onClose}
        selectedCategory={state.selectedCategory}
        selectedSeason={state.selectedSeason}
        memberIds={state.resolveMemberIds()}
        onSuccess={() => {
          void state.refetchSessions();
        }}
      />

      <DeleteDialog
        isOpen={state.deleteModal.isOpen}
        onClose={state.deleteModal.closeAndClear}
        onSubmit={state.confirmDeleteSession}
        title={translations.attendance.modal.title.deleteSession}
        message={translations.attendance.modal.description.deleteSession}
        isLoading={state.loadingCrudOperations}
      />

      <TrainingSessionStatusDialog
        isOpen={state.statusDialog.isOpen}
        onClose={state.statusDialog.closeAndClear}
        onConfirm={state.handleStatusUpdate}
        currentStatus={state.statusDialog.selectedItem?.status || TrainingSessionStatusEnum.PLANNED}
        sessionTitle={state.statusDialog.selectedItem?.title || ''}
      />
    </>
  );
}

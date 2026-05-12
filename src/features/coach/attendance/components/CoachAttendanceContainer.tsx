'use client';

import {Button, Select, SelectItem} from '@heroui/react';

import {CalendarIcon, PlusIcon} from '@heroicons/react/24/outline';

import {attendanceTabsLabels} from '@/enums/getAttendanceTabOptions';

import {translations} from '@/lib/translations';

import {hasMoreThanOne} from '@/utils/arrayHelper';

import {useAppData} from '@/contexts/AppDataContext';

import {ContentCard, DeleteDialog, Grid, GridItem} from '@/components';
import {AttendanceTabs, TrainingSessionStatusEnum} from '@/enums';
import {AppPageLayout} from '@/shared/components';

import {useCoachAttendancePageLogic} from '../hooks/useCoachAttendancePageLogic';

import {
  AttendanceRecordingTable,
  AttendanceStatisticsLazy,
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

              <div className="flex items-stretch sm:items-end gap-2">
                <Button
                  color="primary"
                  startContent={<PlusIcon className="w-4 h-4" />}
                  onPress={state.sessionModal.openEmpty}
                  isDisabled={!state.selectedCategory || !state.selectedSeason}
                  className="w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">
                    {translations.attendance.labels.newSession}
                  </span>
                </Button>
                <Button
                  color="primary"
                  variant="bordered"
                  onPress={state.generatorModal.onOpen}
                  isDisabled={!state.selectedCategory || !state.selectedSeason}
                  isIconOnly
                  aria-label={translations.attendance.ariaLabels.sessionGeneration}
                  className="w-full sm:w-auto"
                >
                  <CalendarIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </ContentCard>
        }
        tabs={[
          {
            key: AttendanceTabs.ATTENDANCE,
            title: tabLabels[AttendanceTabs.ATTENDANCE],
            content: (
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
                  <AttendanceRecordingTable
                    attendanceRecords={state.attendanceRecords}
                    selectedSession={state.selectedSession}
                    handleRecordAttendance={state.handleRecordAttendance}
                    handleCreateAttendanceForSession={state.handleCreateAttendanceForSession}
                    loading={state.attendanceLoading}
                    selectedSessionData={state.selectedSessionData}
                  />
                </GridItem>
              </Grid>
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

'use client';

import {useState} from 'react';

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Select,
  SelectItem,
  Tooltip,
} from '@heroui/react';

import {CalendarIcon, PencilIcon, PlusIcon, TrashIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {hasMoreThanOne} from '@/utils/arrayHelper';

import {useAppData} from '@/contexts/AppDataContext';

import {ContentCard, DeleteDialog, HStack} from '@/components';
import {TrainingSessionStatusEnum} from '@/enums';
import {formatDateString, formatTime} from '@/helpers';
import {AppPageLayout, FloatingActions} from '@/shared/components';

import {useCoachAttendancePageLogic} from '../hooks/useCoachAttendancePageLogic';

import {
  AttendanceRecordingPanel,
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

  const [mobileAttendanceOpen, setMobileAttendanceOpen] = useState(false);

  const handleSessionSelect = (sessionId: string | null) => {
    state.setSelectedSession(sessionId);
    if (sessionId && typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileAttendanceOpen(true);
    }
  };

  return (
    <>
      <AppPageLayout
        isLoading={state.isAllLoadings}
        header={
          <ContentCard padding="none">
            <div className="flex flex-row gap-4 justify-between items-center">
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
                  size={'sm'}
                >
                  {seasons.map((season) => (
                    <SelectItem key={season.id}>{season.name}</SelectItem>
                  ))}
                </Select>
              </div>
              {/* Mobile action buttons — visible only below lg */}
              <div className="flex lg:hidden items-center gap-2 self-end h-max">
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  onPress={state.sessionModal.openEmpty}
                  aria-label={translations.attendance.labels.newSession}
                >
                  <PlusIcon className="w-4 h-4" />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  onPress={state.generatorModal.onOpen}
                  aria-label={translations.attendance.ariaLabels.sessionGeneration}
                >
                  <CalendarIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </ContentCard>
        }
        floatingActions={
          <FloatingActions
            className="hidden lg:flex"
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
      >
        <div className="flex flex-col gap-4">
          {/* Stats row */}
          <AttendanceStatsCards
            sessions={state.sessions}
            statistics={state.attendanceStatistics}
            isLoading={state.statsLoading}
          />

          {/* Two-column layout — attendance panel hidden on mobile (opens in modal) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <TrainingSessionList
                sessions={state.sessions}
                selectedSession={state.selectedSession}
                onSelectedSession={handleSessionSelect}
                onStatusChange={state.statusDialog.openWith}
                onEditSession={state.sessionModal.openWith}
                onDeleteSession={state.deleteModal.openWith}
                loading={state.trainingSessionsLoading}
              />
            </div>
            <div className="hidden lg:block lg:col-span-2">
              <AttendanceRecordingPanel
                attendanceRecords={state.attendanceRecords}
                selectedSession={state.selectedSession}
                selectedSessionData={state.selectedSessionData}
                loading={state.attendanceLoading}
                memberHistory={state.memberHistory}
                onRecordAttendance={state.handleRecordAttendance}
                onBulkUpdate={state.handleBulkUpdate}
              />
            </div>
          </div>
        </div>
      </AppPageLayout>

      {/* Mobile attendance modal — full-screen sheet */}
      <Modal
        isOpen={mobileAttendanceOpen}
        onClose={() => setMobileAttendanceOpen(false)}
        size="full"
        classNames={{base: 'lg:hidden', body: 'p-3 overflow-y-auto'}}
      >
        <ModalContent>
          <ModalHeader className="flex items-center justify-between gap-3 py-3 border-b border-divider">
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{state.selectedSessionData?.title}</p>
              {state.selectedSessionData && (
                <p className="text-sm font-normal text-foreground-500">
                  {formatDateString(state.selectedSessionData.session_date)}
                  {state.selectedSessionData.session_time &&
                    ` · ${formatTime(state.selectedSessionData.session_time)}`}
                </p>
              )}
            </div>
          </ModalHeader>
          <ModalBody>
            <AttendanceRecordingPanel
              attendanceRecords={state.attendanceRecords}
              selectedSession={state.selectedSession}
              selectedSessionData={state.selectedSessionData}
              loading={state.attendanceLoading}
              memberHistory={state.memberHistory}
              onRecordAttendance={state.handleRecordAttendance}
              onBulkUpdate={state.handleBulkUpdate}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

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

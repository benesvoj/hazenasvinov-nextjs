'use client';

import React, {useMemo} from 'react';

import {Button, Chip, Tooltip} from '@heroui/react';

import {ArrowPathIcon, UserPlusIcon} from '@heroicons/react/24/outline';

import {useModal, useModalWithItem} from '@/hooks/shared/useModals';

import {translations} from '@/lib/translations';

import {ContentCard, HStack, LoadingSpinner, UnifiedTable} from '@/components';
import {useUser} from '@/contexts';
import {ActionTypes, AttendanceStatuses, ColumnAlignType} from '@/enums';
import {
  AttendanceSyncScope,
  MemberAttendanceSync,
} from '@/features/coach/lineups/helpers/describeAttendanceSync';
import {useCoachCategory} from '@/features/coach/providers/CategoryProvider';
import {getMemberFullName} from '@/helpers';
import {
  useCategoryLineupMembers,
  useFetchAttendanceSync,
  useFetchCategoryLineupMembers,
  useSyncAttendanceWithLineup,
} from '@/hooks';
import {
  CategoryLineupMemberWithMember,
  ColumnType,
  CreateCategoryLineupMember,
  CreateCategoryLineupMemberModal,
} from '@/types';
import {hasItems} from '@/utils';

import {getPositionColor, getPositionText} from '../helpers/helpers';

import {AttendanceSyncDialog} from './AttendanceSyncDialog';
import LineupMemberAssignDialog from './LineupMemberAssignDialog';
import {LineupMemberRemoveDialog} from './LineupMemberRemoveDialog';

interface LineupMembersProps {
  lineupId: string;
  categoryId: string;
  seasonId: string;
  /**
   * Only the active lineup is what attendance is generated from, so it is the
   * only one worth reconciling against. Syncing from an archived lineup would
   * write the wrong squad into the sheets.
   */
  isActiveLineup: boolean;
}

const t = translations.lineupMembers;
const tSync = t.attendanceSync;

/** Empty per-member sync figures, used before the summary has loaded. */
const NO_SYNC: MemberAttendanceSync = {
  memberId: '',
  missingPlanned: 0,
  missingOther: 0,
  missingTotal: 0,
  recordedInPlanned: 0,
  recordedInPlannedPast: 0,
};

export const LineupMembers = ({
  lineupId,
  categoryId,
  seasonId,
  isActiveLineup,
}: LineupMembersProps) => {
  const {availableCategories} = useCoachCategory();
  const {user} = useUser();
  const {
    data: lineupMembers,
    loading: loadingLineupMembers,
    refetch: fetchLineupMembers,
  } = useFetchCategoryLineupMembers({lineupId});

  const {
    createCategoryLineupMember,
    removeCategoryLineupMember,
    loading: CRUDLoading,
  } = useCategoryLineupMembers();

  const modal = useModal();
  const removeModal = useModalWithItem<CategoryLineupMemberWithMember>();
  const syncModal = useModalWithItem<CategoryLineupMemberWithMember>();
  const syncAllModal = useModal();

  const memberIds = useMemo(() => lineupMembers.map((member) => member.member_id), [lineupMembers]);

  // The lineup query already drops deactivated members, so these ids are the
  // squad attendance should cover.
  const {summary, byMemberId} = useFetchAttendanceSync({
    categoryId: isActiveLineup ? categoryId : '',
    seasonId: isActiveLineup ? seasonId : '',
    memberIds,
  });

  const {
    addToAttendance,
    removeFromAttendance,
    loading: syncLoading,
  } = useSyncAttendanceWithLineup();

  const syncFor = (memberId: string): MemberAttendanceSync => byMemberId.get(memberId) ?? NO_SYNC;

  const handleAddMemberToLineup = () => {
    modal.onOpen();
  };

  const handleAddMember = async (memberData: CreateCategoryLineupMemberModal) => {
    if (!categoryId) {
      throw new Error('Není vybrána žádná kategorie.');
    }

    if (!lineupId) {
      throw new Error('Není vybrána žádná soupiska. Prosím vyberte soupisku před přidáním člena.');
    }

    try {
      await createCategoryLineupMember({
        ...memberData,
        lineup_id: lineupId,
        created_by: user?.id || '',
        is_active: true,
      } as CreateCategoryLineupMember);
      await fetchLineupMembers();
    } catch (err) {
      console.error('Error adding member:', err);
      throw err;
    }
  };

  const existingMemberIds = lineupMembers.map((member) => member.member_id);
  const existingJerseyNumbers = lineupMembers
    .map((member) => member.jersey_number)
    .filter((num) => num !== null && num !== undefined) as number[];

  /**
   * Attendance is removed first. If the second step then fails, the member is
   * still on the lineup and shows up as out of sync — visible and repairable.
   * The other order would leave deleted attendance behind a member who is gone
   * from the roster, with nothing pointing at it.
   */
  const handleRemoveMemberFromLineup = async (alsoRemoveAttendance: boolean) => {
    const selectedItem = removeModal.selectedItem;
    if (!selectedItem) return;

    if (alsoRemoveAttendance) {
      await removeFromAttendance({
        categoryId,
        seasonId,
        memberIds: [selectedItem.member_id],
        scope: AttendanceSyncScope.PLANNED,
      });
    }

    await removeCategoryLineupMember(selectedItem.id);
    removeModal.closeAndClear();
    await fetchLineupMembers();
  };

  const handleSyncMember = async (scope: AttendanceSyncScope, status: AttendanceStatuses) => {
    const selectedItem = syncModal.selectedItem;
    if (!selectedItem) return;

    await addToAttendance({
      categoryId,
      seasonId,
      memberIds: [selectedItem.member_id],
      scope,
      status,
    });
    syncModal.closeAndClear();
  };

  const handleSyncAll = async (scope: AttendanceSyncScope, status: AttendanceStatuses) => {
    const outOfSync = summary.members
      .filter((member) => member.missingTotal > 0)
      .map((member) => member.memberId);

    if (!hasItems(outOfSync)) return;

    await addToAttendance({categoryId, seasonId, memberIds: outOfSync, scope, status});
    syncAllModal.onClose();
  };

  const bulkTotals = useMemo(
    () => ({
      missingTotal: summary.missingRecords,
      missingPlanned: summary.members.reduce((sum, member) => sum + member.missingPlanned, 0),
    }),
    [summary]
  );

  const columns: ColumnType<CategoryLineupMemberWithMember>[] = [
    {key: 'member', label: t.table.columns.member, align: 'left' as ColumnAlignType},
    {key: 'position', label: t.table.columns.position, align: 'left' as ColumnAlignType},
    {
      key: 'jersey_number',
      label: t.table.columns.jersey_number,
      align: 'center' as ColumnAlignType,
    },
    {key: 'functions', label: t.table.columns.functions, align: 'center' as ColumnAlignType},
    ...(isActiveLineup
      ? [
          {
            key: 'attendance',
            label: tSync.columnLabel,
            align: 'center' as ColumnAlignType,
          },
        ]
      : []),
    {
      key: 'actions',
      label: t.table.columns.actions,
      isActionColumn: true,
      align: 'center' as ColumnAlignType,
      actions: [
        {
          type: ActionTypes.DELETE,
          onPress: (member) => removeModal.openWith(member),
          title: translations.lineupMembers.buttons.removeMember,
        },
      ],
    },
  ];

  const renderCells = (member: CategoryLineupMemberWithMember, columnKey: string) => {
    switch (columnKey) {
      case 'member':
        return (
          <div>
            <div className="font-medium text-sm sm:text-base">
              {member.members?.surname} {member.members?.name}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">
              {member.members?.registration_number}
            </div>
          </div>
        );
      case 'position':
        return (
          <Chip color={getPositionColor(member.position)} size="sm">
            {getPositionText(member.position)}
          </Chip>
        );
      case 'jersey_number':
        return member.jersey_number ? (
          <Chip size="sm" color="primary" variant="flat">
            #{member.jersey_number}
          </Chip>
        ) : (
          <span className="text-gray-400">-</span>
        );
      case 'functions':
        return (
          <div className="flex gap-1">
            {member.is_captain && (
              <Chip size="sm" color="warning">
                {translations.lineupMembers.lineupMemberSetupCard.functionSection.captain}
              </Chip>
            )}
            {member.is_vice_captain && (
              <Chip size={'sm'} color={'secondary'}>
                {translations.lineupMembers.lineupMemberSetupCard.functionSection.viceCaptain}
              </Chip>
            )}
          </div>
        );
      case 'attendance': {
        // The icon is the notification: a row whose attendance already matches
        // the lineup offers no action, so nothing is drawn for it.
        const missing = syncFor(member.member_id).missingTotal;
        if (missing === 0) return null;

        return (
          <Tooltip content={tSync.outOfSyncTooltip(missing)}>
            <Button
              size="sm"
              isIconOnly
              variant="flat"
              color="warning"
              aria-label={tSync.outOfSyncTooltip(missing)}
              onPress={() => syncModal.openWith(member)}
              startContent={<ArrowPathIcon className="w-4 h-4" />}
            />
          </Tooltip>
        );
      }
    }
  };

  const title = (
    <>
      {t.title} {lineupId ? `(${lineupMembers.length})` : ''}
    </>
  );

  const actions = (
    <HStack spacing={2} align="center">
      {summary.membersOutOfSync > 0 && (
        <Button
          size="sm"
          color="warning"
          variant="flat"
          startContent={<ArrowPathIcon className="w-4 h-4" />}
          onPress={syncAllModal.onOpen}
        >
          {tSync.syncAll}
        </Button>
      )}
      <Button
        size="sm"
        color="primary"
        startContent={<UserPlusIcon className="w-4 h-4" />}
        onPress={handleAddMemberToLineup}
      >
        {t.addMember}
      </Button>
    </HStack>
  );

  const selectedForSync = syncModal.selectedItem;
  const selectedForRemoval = removeModal.selectedItem;

  return (
    <>
      {/*
        isLoading is deliberately not passed here. ContentCard swaps its children
        for a spinner while loading, so the table below was unmounted and rebuilt
        on every refetch — including the one right after adding a member, while
        the dialog's portal was closing. The table renders its own loading state
        instead, and stays mounted.
      */}
      <ContentCard
        title={title}
        actions={lineupId && actions}
        padding={'none'}
        subtitle={
          summary.membersOutOfSync > 0
            ? tSync.summaryChip(summary.membersOutOfSync, summary.missingRecords)
            : undefined
        }
      >
        <UnifiedTable
          columns={columns}
          renderCell={renderCells}
          data={lineupMembers}
          getKey={(member: CategoryLineupMemberWithMember) => member.id}
          ariaLabel={t.table.ariaLabel}
          isLoading={loadingLineupMembers}
          loadingContent={<LoadingSpinner />}
          emptyContent={t.noLineupMembers}
          isStriped
        />
      </ContentCard>

      <LineupMemberAssignDialog
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        onAddMember={handleAddMember}
        selectedCategoryId={categoryId}
        existingMembers={existingMemberIds}
        existingJerseyNumbers={existingJerseyNumbers}
        categories={availableCategories}
      />

      {selectedForSync && (
        <AttendanceSyncDialog
          isOpen={syncModal.isOpen}
          onClose={syncModal.closeAndClear}
          onSubmit={handleSyncMember}
          isLoading={syncLoading}
          totals={syncFor(selectedForSync.member_id)}
          intro={tSync.dialog.intro(
            getMemberFullName(selectedForSync.members) || '',
            syncFor(selectedForSync.member_id).missingTotal
          )}
        />
      )}

      <AttendanceSyncDialog
        isOpen={syncAllModal.isOpen}
        onClose={syncAllModal.onClose}
        onSubmit={handleSyncAll}
        isLoading={syncLoading}
        totals={bulkTotals}
        intro={tSync.dialog.introAll(summary.membersOutOfSync, summary.missingRecords)}
        isBulk
      />

      {selectedForRemoval && (
        <LineupMemberRemoveDialog
          isOpen={removeModal.isOpen}
          onClose={removeModal.closeAndClear}
          onSubmit={handleRemoveMemberFromLineup}
          isLoading={CRUDLoading || syncLoading}
          memberName={getMemberFullName(selectedForRemoval.members) || ''}
          recordedInPlanned={syncFor(selectedForRemoval.member_id).recordedInPlanned}
          recordedInPlannedPast={syncFor(selectedForRemoval.member_id).recordedInPlannedPast}
        />
      )}
    </>
  );
};

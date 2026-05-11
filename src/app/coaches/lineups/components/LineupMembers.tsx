'use client';

import React, {useEffect} from 'react';

import {Button, Chip} from '@heroui/react';

import {UserPlusIcon} from '@heroicons/react/24/outline';

import {useModal, useModalWithItem} from '@/hooks/shared/useModals';

import {translations} from '@/lib/translations';

import LineupMemberAssignDialog from '@/app/coaches/lineups/components/LineupMemberAssignDialog';
import {getPositionColor, getPositionText} from '@/app/coaches/lineups/helpers/helpers';

import {ContentCard, DeleteDialog, EmptyState, UnifiedTable} from '@/components';
import {useUser} from '@/contexts';
import {ActionTypes, ColumnAlignType} from '@/enums';
import {useCoachCategory} from '@/features/coach/providers/CategoryProvider';
import {useCategoryLineupMembers, useFetchCategoryLineupMembers} from '@/hooks';
import {
  CategoryLineupMemberWithMember,
  ColumnType,
  CreateCategoryLineupMember,
  CreateCategoryLineupMemberModal,
} from '@/types';

interface LineupMembersProps {
  lineupId: string;
  categoryId: string;
}

const t = translations.lineupMembers;

export const LineupMembers = ({lineupId, categoryId}: LineupMembersProps) => {
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
  const deleteModal = useModalWithItem<CategoryLineupMemberWithMember>();

  const handleAddMemberToLineup = () => {
    modal.onOpen();
  };

  // Fetch lineup members when lineup changes
  useEffect(() => {
    if (lineupId) {
      void fetchLineupMembers();
    }
  }, [lineupId, fetchLineupMembers]);

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

  const handleRemoveMemberFromLineup = async () => {
    const selectedItemId = deleteModal.selectedItem?.id;

    if (!selectedItemId) return;

    await removeCategoryLineupMember(selectedItemId);
    deleteModal.closeAndClear();
    await fetchLineupMembers();
  };

  const columns: ColumnType<CategoryLineupMemberWithMember>[] = [
    {key: 'member', label: t.table.columns.member, align: 'left' as ColumnAlignType},
    {key: 'position', label: t.table.columns.position, align: 'left' as ColumnAlignType},
    {
      key: 'jersey_number',
      label: t.table.columns.jersey_number,
      align: 'center' as ColumnAlignType,
    },
    {key: 'functions', label: t.table.columns.functions, align: 'center' as ColumnAlignType},
    {
      key: 'actions',
      label: t.table.columns.actions,
      isActionColumn: true,
      align: 'center' as ColumnAlignType,
      actions: [
        {
          type: ActionTypes.DELETE,
          onPress: (member) => deleteModal.openWith(member),
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
    }
  };

  const title = (
    <>
      {t.title} {lineupId ? `(${lineupMembers.length})` : ''}
    </>
  );

  const actions = (
    <Button
      size="sm"
      color="primary"
      startContent={<UserPlusIcon className="w-4 h-4" />}
      onPress={handleAddMemberToLineup}
    >
      {t.addMember}
    </Button>
  );

  return (
    <>
      <ContentCard
        title={title}
        actions={lineupId && actions}
        padding={'none'}
        isLoading={loadingLineupMembers}
      >
        <UnifiedTable
          columns={columns}
          renderCell={renderCells}
          data={lineupMembers}
          getKey={(member: CategoryLineupMemberWithMember) => member.id}
          ariaLabel={t.table.ariaLabel}
          isLoading={loadingLineupMembers}
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

      <DeleteDialog
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeAndClear}
        onSubmit={handleRemoveMemberFromLineup}
        title={translations.lineupMembers.deleteLineupMemberDialog.title}
        message={translations.lineupMembers.deleteLineupMemberDialog.message}
        isLoading={CRUDLoading}
      />
    </>
  );
};

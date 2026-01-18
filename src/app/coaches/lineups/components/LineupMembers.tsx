'use client';

import React, {useEffect, useState} from 'react';

import {Button, Card, CardBody, CardHeader, Chip, useDisclosure} from '@heroui/react';

import {UserPlusIcon} from '@heroicons/react/24/outline';

import {getPositionColor, getPositionText} from '@/app/coaches/lineups/helpers/helpers';

import {Heading, UnifiedTable} from '@/components';
import {ActionTypes, ColumnAlignType} from '@/enums';
import {
  useCategoryLineupMember,
  useCustomModal,
  useFetchCategories,
  useFetchCategoryLineupMembers,
} from '@/hooks';
import {translations} from '@/lib';
import {
  CategoryLineupMemberWithMember,
  ColumnType,
  CreateCategoryLineupMemberModal,
  UpdateCategoryLineupMember,
} from '@/types';

import AddMemberModal from './AddMemberModal';

interface LineupMembersProps {
  lineupId: string;
  categoryId: string;
}

const t = translations.coachPortal.lineupMembers;
const tAction = translations.action;

export const LineupMembers = ({lineupId, categoryId}: LineupMembersProps) => {
  const {
    data: lineupMembers,
    loading: loadingLineupMembers,
    refetch: fetchLineupMembers,
  } = useFetchCategoryLineupMembers(categoryId, lineupId);

  const {createLineupMember, updateLineupMember} = useCategoryLineupMember();
  const {data: categories} = useFetchCategories();

  const {
    isOpen: isAddMemberModalOpen,
    onOpen: onAddMemberModalOpen,
    onClose: onAddMemberModalClose,
  } = useCustomModal();

  const [deleteOption, setDeleteOption] = useState<string>('');
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure();

  const handleAddMemberToLineup = () => {
    onAddMemberModalOpen();
  };

  // Fetch lineup members when lineup changes
  useEffect(() => {
    if (lineupId) {
      fetchLineupMembers();
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
      await createLineupMember(categoryId, lineupId, memberData);
    } catch (err) {
      console.error('Error adding member:', err);
      throw err; // Re-throw to show error in modal
    }
  };

  const handleEditMember = async (memberData: UpdateCategoryLineupMember) => {
    if (!categoryId) {
      throw new Error('Není vybrána žádná kategorie.');
    }

    if (!lineupId) {
      throw new Error('Není vybrána žádná soupiska. Prosím vyberte soupisku před přidáním člena.');
    }

    try {
      await updateLineupMember(categoryId, lineupId, memberData.id, memberData);
    } catch (err) {
      console.error('Error updating member:', err);
      throw err; // Re-throw to show error in modal
    }
  };

  // Get existing member IDs and jersey numbers for the modal
  const existingMemberIds = lineupMembers.map((member) => member.member_id);
  const existingJerseyNumbers = lineupMembers
    .map((member) => member.jersey_number)
    .filter((num) => num !== null && num !== undefined) as number[];

  const handleDeleteLineupMember = (memberId: string) => {
    setDeleteOption('member');
    setMemberToDelete(memberId);
    onDeleteModalOpen();
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
          type: ActionTypes.UPDATE,
          onPress: (member) => handleEditMember(member),
          title: tAction.edit,
        },
        {
          type: ActionTypes.DELETE,
          onPress: (member) => handleDeleteLineupMember(member.id),
          title: tAction.delete,
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
                Kapitán
              </Chip>
            )}
          </div>
        );
    }
  };

  return (
    <>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <Heading size={3}>
                {t.title} {lineupId ? `(${lineupMembers.length})` : ''}
              </Heading>
              {lineupId && (
                <Button
                  size="sm"
                  color="primary"
                  startContent={<UserPlusIcon className="w-4 h-4" />}
                  onPress={handleAddMemberToLineup}
                >
                  {t.addMember}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {!lineupId ? (
              <p className="text-gray-500 text-center py-8">{t.selectLineupPrompt}</p>
            ) : (
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
            )}
          </CardBody>
        </Card>
      </div>

      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={onAddMemberModalClose}
        onAddMember={handleAddMember}
        selectedCategoryName={categories.find((c) => c.id === categoryId)?.name || ''}
        selectedCategoryId={categoryId}
        existingMembers={existingMemberIds}
        existingJerseyNumbers={existingJerseyNumbers}
      />
    </>
  );
};

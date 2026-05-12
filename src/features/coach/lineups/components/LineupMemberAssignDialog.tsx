'use client';

import React, {useEffect, useMemo, useState} from 'react';

import {Button} from '@heroui/button';
import {Checkbox} from '@heroui/checkbox';
import {Chip} from '@heroui/chip';
import {Pagination} from '@heroui/pagination';
import {Switch} from '@heroui/react';
import {Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from '@heroui/table';

import {UserPlusIcon} from '@heroicons/react/24/outline';

import {QUICK_CREATE} from '@/components/shared/members/modals/config/memberFormConfig';
import {MemberFormModal} from '@/components/shared/members/modals/MemberFormModal';

import {translations} from '@/lib/translations';

import {Dialog, Hide, HStack, Search, Show, VStack} from '@/components';
import {useFetchMembersInternal, useModal} from '@/hooks';
import {Category, CreateCategoryLineupMemberModal} from '@/types';
import {isEmpty, isNotNilOrEmpty} from '@/utils';

import {
  DEFAULT_SETUP_DATA,
  LineupMemberSetupCard,
  LineupMemberSetupData,
} from './LineupMemberSetupCard';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (memberData: CreateCategoryLineupMemberModal) => Promise<void>;
  selectedCategoryId: string;
  existingMembers: string[];
  existingJerseyNumbers: number[];
  categories: Category[];
}

export default function LineupMemberAssignDialog({
  isOpen,
  onClose,
  onAddMember,
  selectedCategoryId,
  existingMembers,
  existingJerseyNumbers,
  categories,
}: AddMemberModalProps) {
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [setupData, setSetupData] = useState<LineupMemberSetupData>(DEFAULT_SETUP_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    if (!isOpen) {
      setSelectedMember('');
      setSetupData(DEFAULT_SETUP_DATA);
      setSearchTerm('');
      setShowAll(false);
      setPage(1);
    }
  }, [isOpen]);

  const newMemberModal = useModal();

  const {data: members, loading: membersLoading} = useFetchMembersInternal({
    filters: showAll ? {} : {category_id: selectedCategoryId},
    search: searchTerm,
    enabled: isOpen,
    limit: 100,
  });

  // Handle new member creation
  const handleMemberCreated = (memberId: string) => {
    setSelectedMember(memberId);
  };

  // Filter out already added members (category and search filtering handled by hook)
  const filteredMembers = useMemo(() => {
    return members.filter((member) => !existingMembers.includes(member.id || ''));
  }, [members, existingMembers]);

  // Clear selection if selected member is no longer in the filtered list
  useEffect(() => {
    if (selectedMember && !filteredMembers.some((m) => m.id === selectedMember)) {
      setSelectedMember('');
      setSetupData(DEFAULT_SETUP_DATA);
    }
  }, [filteredMembers, selectedMember]);

  // Reset page when data changes
  useEffect(() => {
    setPage(1);
  }, [members, searchTerm, showAll]);

  const totalPages = Math.ceil(filteredMembers.length / rowsPerPage);
  const paginatedMembers = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredMembers.slice(start, start + rowsPerPage);
  }, [filteredMembers, page]);

  const handleSubmit = async () => {
    if (!selectedMember) return;

    try {
      setIsSubmitting(true);

      const memberData: CreateCategoryLineupMemberModal = {
        member_id: selectedMember,
        position: setupData.position,
        jersey_number: setupData.jerseyNumber ? parseInt(setupData.jerseyNumber) : null,
        is_captain: setupData.isCaptain,
        is_vice_captain: setupData.isViceCaptain,
      };

      await onAddMember(memberData);

      onClose();
    } catch (error) {
      console.error('Error adding member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMemberData = members.find((m) => m.id === selectedMember);

  const addButton = (
    <Button
      color="primary"
      size="sm"
      onPress={newMemberModal.onOpen}
      startContent={<UserPlusIcon className="w-4 h-4" />}
    >
      {translations.lineupMembers.buttons.createNewMember}
    </Button>
  );

  const hasNoItemsToShow = isEmpty(filteredMembers) && isNotNilOrEmpty(searchTerm);

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={translations.lineupMembers.titles.addMemberToLineup}
        size="4xl"
        scrollBehavior="inside"
        className="h-[60vh]"
        onSubmit={handleSubmit}
        isLoading={membersLoading || isSubmitting}
      >
        <HStack justify={'between'} align={'center'} spacing={2}>
          <VStack justify={'start'} align="start" spacing={4} className={'w-1/3'}>
            <Search
              placeholder={translations.lineupMembers.labels.search}
              value={searchTerm}
              onChange={setSearchTerm}
            />

            <Switch
              aria-label={`switch-${translations.lineupMembers.labels.showAll}`}
              isSelected={showAll}
              onValueChange={setShowAll}
              size="sm"
              isDisabled={membersLoading}
            >
              {!showAll
                ? translations.lineupMembers.labels.showAll
                : translations.lineupMembers.labels.hideAll}
            </Switch>
          </VStack>
          <Hide when={hasNoItemsToShow}>{addButton}</Hide>
        </HStack>

        <Show when={hasNoItemsToShow}>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? translations.lineupMembers.responseMessages.lineupMembersSearchNotFound
                : translations.lineupMembers.responseMessages.lineupMembersNotFound}
            </p>
            {addButton}
          </div>
        </Show>

        <Hide when={hasNoItemsToShow}>
          <Table
            aria-label={translations.lineupMembers.labels.availableMembers}
            className="w-full h-max-60"
            selectionMode="single"
          >
            <TableHeader>
              <TableColumn>{translations.lineupMembers.labels.select}</TableColumn>
              <TableColumn>{translations.lineupMembers.labels.member}</TableColumn>
              <TableColumn>{translations.lineupMembers.labels.registrationNumber}</TableColumn>
              <TableColumn>{translations.categories.labels.category}</TableColumn>
            </TableHeader>
            <TableBody>
              {paginatedMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Checkbox
                      isSelected={selectedMember === member.id}
                      onValueChange={(checked) => setSelectedMember(checked ? member.id || '' : '')}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {member.name} {member.surname}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat">
                      {member.registration_number}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat" color="primary">
                      {member.category_name}
                    </Chip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="default"
                page={page}
                total={totalPages}
                onChange={setPage}
              />
            </div>
          )}
        </Hide>

        {selectedMemberData && (
          <LineupMemberSetupCard
            existingJerseyNumbers={existingJerseyNumbers}
            selectedMemberData={selectedMemberData}
            value={setupData}
            onChange={setSetupData}
          />
        )}
      </Dialog>

      <MemberFormModal
        isOpen={newMemberModal.isOpen}
        onClose={newMemberModal.onClose}
        onSuccess={(member) => handleMemberCreated(member.id)}
        sections={QUICK_CREATE}
        categories={categories}
        member={null}
      />
    </>
  );
}

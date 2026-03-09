'use client';

import React, {useMemo, useState} from 'react';

import {Button} from '@heroui/button';
import {Card, CardBody} from '@heroui/card';
import {Checkbox} from '@heroui/checkbox';
import {Chip} from '@heroui/chip';
import {Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from '@heroui/table';

import {UserPlusIcon} from '@heroicons/react/24/outline';

import {
  FULL_CREATE,
  QUICK_CREATE,
} from '@/components/shared/members/modals/config/memberFormConfig';
import {MemberFormModal} from '@/components/shared/members/modals/MemberFormModal';

import {Choice, Dialog, Search} from '@/components';
import {getPlayerPositionOptions, PlayerPosition} from '@/enums';
import {useFetchMembersInternal} from '@/hooks';
import {CreateCategoryLineupMemberModal} from '@/types';
import {isEmpty} from '@/utils';

import {CreateMemberModal} from './';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (memberData: CreateCategoryLineupMemberModal) => Promise<void>;
  selectedCategoryName: string; // Category Name
  selectedCategoryId: string; // Category Id
  existingMembers: string[]; // Array of member IDs already in the lineup
  existingJerseyNumbers: number[]; // Array of jersey numbers already used
}

export default function LineupMemberAssignDialog({
  isOpen,
  onClose,
  onAddMember,
  selectedCategoryName,
  selectedCategoryId,
  existingMembers,
  existingJerseyNumbers,
}: AddMemberModalProps) {
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [position, setPosition] = useState<'goalkeeper' | 'field_player'>('field_player');
  const [jerseyNumber, setJerseyNumber] = useState<string>('');
  const [isCaptain, setIsCaptain] = useState(false);
  const [isViceCaptain, setIsViceCaptain] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateMemberModalOpen, setIsCreateMemberModalOpen] = useState(false);
  const [isMemberFormModalOpen, setIsMemberFormModalOpen] = useState(false);

  const {data: members, loading: membersLoading} = useFetchMembersInternal({
    filters: {category_id: selectedCategoryId},
    search: searchTerm,
    enabled: isOpen,
    limit: 100,
  });

  // Handle new member creation
  const handleMemberCreated = (memberId: string) => {
    // Select the newly created member
    setSelectedMember(memberId);
    // Close the create member modal
    setIsCreateMemberModalOpen(false);
  };

  // Filter out already added members (category and search filtering handled by hook)
  const filteredMembers = useMemo(() => {
    return members.filter((member) => !existingMembers.includes(member.id || ''));
  }, [members, existingMembers]);

  // Get available jersey numbers
  const availableJerseyNumbers = useMemo(() => {
    const numbers = [];
    for (let i = 1; i <= 99; i++) {
      if (!existingJerseyNumbers.includes(i)) {
        numbers.push(i);
      }
    }
    return numbers;
  }, [existingJerseyNumbers]);

  const handleSubmit = async () => {
    if (!selectedMember) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Only send fields that should be set by the client
      // lineup_id, added_by, and is_active are handled by the API
      const memberData: CreateCategoryLineupMemberModal = {
        member_id: selectedMember,
        position,
        jersey_number: jerseyNumber ? parseInt(jerseyNumber) : null,
        is_captain: isCaptain,
        is_vice_captain: isViceCaptain,
      };

      await onAddMember(memberData);

      // Reset form
      setSelectedMember('');
      setPosition('field_player');
      setJerseyNumber('');
      setIsCaptain(false);
      setIsViceCaptain(false);
      setSearchTerm('');
      setError(null);

      onClose();
    } catch (error) {
      console.error('Error adding member:', error);
      setError(error instanceof Error ? error.message : 'Chyba při přidávání člena');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setSelectedMember('');
    setPosition('field_player');
    setJerseyNumber('');
    setIsCaptain(false);
    setIsViceCaptain(false);
    setSearchTerm('');
    setError(null);
    onClose();
  };

  const selectedMemberData = members.find((m) => m.id === selectedMember);

  const jerseyNumberOptions = availableJerseyNumbers.map((number) => ({
    key: number.toString(),
    label: number.toString(),
  }));
  const positionOptions = getPlayerPositionOptions().map((option) => ({
    key: option.value,
    label: option.label,
  }));

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        title={'Přidat člena do soupisky'}
        size="4xl"
        scrollBehavior="inside"
        className="h-[60vh]"
        onSubmit={handleSubmit}
        isLoading={membersLoading}
      >
        <Search
          placeholder="Hledat člena..."
          value={searchTerm}
          onChange={setSearchTerm}
          className="w-full"
        />

        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Vyberte člena</h3>
          <Button
            color="secondary"
            variant="bordered"
            size="sm"
            className="mt-2"
            onPress={() => setIsMemberFormModalOpen(true)}
          >
            Přidat nového člena
          </Button>
        </div>

        {isEmpty(filteredMembers) ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Žádní členové neodpovídají vyhledávání' : 'Žádní dostupní členové'}
            </p>
            {!searchTerm && (
              <Button
                color="primary"
                variant="bordered"
                startContent={<UserPlusIcon className="w-4 h-4" />}
                onPress={() => setIsCreateMemberModalOpen(true)}
              >
                Přidat nového člena
              </Button>
            )}
          </div>
        ) : (
          <Table aria-label="Available members" className="w-full h-max-60" selectionMode="single">
            <TableHeader>
              <TableColumn>VYBRAT</TableColumn>
              <TableColumn>ČLEN</TableColumn>
              <TableColumn>REG. ČÍSLO</TableColumn>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Checkbox
                      isSelected={selectedMember === member.id}
                      onValueChange={(checked) => setSelectedMember(checked ? member.id || '' : '')}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {member.name} {member.surname}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat">
                      {member.registration_number}
                    </Chip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {selectedMemberData && (
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold mb-4">Nastavení člena</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Choice
                  items={positionOptions}
                  value={position}
                  onChange={(value) => setPosition(value as PlayerPosition)}
                  label="Pozice"
                  placeholder="Vyberte pozici"
                  isRequired
                />

                <Choice
                  items={jerseyNumberOptions}
                  value={jerseyNumber}
                  onChange={(value) => setJerseyNumber(value as string)}
                  label="Číslo dresu"
                  placeholder="Vyberte číslo"
                />
              </div>

              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Funkce</h4>
                <div className="flex gap-4">
                  <Checkbox
                    isSelected={isCaptain}
                    onValueChange={setIsCaptain}
                    isDisabled={isViceCaptain}
                  >
                    Kapitán
                  </Checkbox>
                  <Checkbox
                    isSelected={isViceCaptain}
                    onValueChange={setIsViceCaptain}
                    isDisabled={isCaptain}
                  >
                    Zástupce kapitána
                  </Checkbox>
                </div>
              </div>

              {/* Selected Member Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Vybraný člen:</h4>
                <div className="text-sm text-gray-600">
                  <div>
                    <strong>Jméno:</strong> {selectedMemberData.name} {selectedMemberData.surname}
                  </div>
                  <div>
                    <strong>Reg. číslo:</strong> {selectedMemberData.registration_number}
                  </div>
                  <div>
                    <strong>Pozice:</strong> {position === 'goalkeeper' ? 'Brankář' : 'Hráč v poli'}
                  </div>
                  {jerseyNumber && (
                    <div>
                      <strong>Číslo dresu:</strong> {jerseyNumber}
                    </div>
                  )}
                  {(isCaptain || isViceCaptain) && (
                    <div>
                      <strong>Funkce:</strong> {isCaptain ? 'Kapitán' : 'Zástupce kapitána'}
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </Dialog>

      <MemberFormModal
        isOpen={isMemberFormModalOpen}
        onClose={() => setIsMemberFormModalOpen(false)}
        onSuccess={() => handleMemberCreated}
        sections={QUICK_CREATE}
        member={null}
      />
    </>
  );
}

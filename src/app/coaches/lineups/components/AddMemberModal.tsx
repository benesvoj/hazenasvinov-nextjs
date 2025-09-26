'use client';

import React, {useState, useEffect, useMemo} from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Spinner,
  Card,
  CardBody,
} from '@heroui/react';
import {useFetchMembers} from '@/hooks/entities/member/useFetchMembers';
import {AddMemberToLineupData} from '@/types/categoryLineup';
import {MagnifyingGlassIcon as SearchIcon, UserPlusIcon} from '@heroicons/react/24/outline';
import {CreateMemberModal} from './';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (memberData: AddMemberToLineupData) => Promise<void>;
  selectedCategoryName: string; // Category Name
  selectedCategoryId: string; // Category Id
  existingMembers: string[]; // Array of member IDs already in the lineup
  existingJerseyNumbers: number[]; // Array of jersey numbers already used
}

export default function AddMemberModal({
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

  const {members, loading: membersLoading, fetchMembers} = useFetchMembers();

  // Fetch members when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, fetchMembers]);

  // Handle new member creation
  const handleMemberCreated = (memberId: string) => {
    // Select the newly created member
    setSelectedMember(memberId);
    // Close the create member modal
    setIsCreateMemberModalOpen(false);
  };

  // Filter members by category and search term
  const filteredMembers = useMemo(() => {
    const filtered = members.filter((member) => {
      // Filter by category
      const memberCategory = member.category_id;

      if (memberCategory !== selectedCategoryId) {
        return false;
      }

      // Filter out already added members
      if (existingMembers.includes(member.id)) {
        return false;
      }

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${member.name} ${member.surname}`.toLowerCase();
        const regNumber = member.registration_number?.toLowerCase() || '';

        const matchesSearch = fullName.includes(searchLower) || regNumber.includes(searchLower);
        return matchesSearch;
      }

      return true;
    });

    return filtered;
  }, [members, selectedCategoryId, existingMembers, searchTerm]);

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

      const memberData: AddMemberToLineupData = {
        member_id: selectedMember,
        position,
        jersey_number: jerseyNumber ? parseInt(jerseyNumber) : undefined,
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

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="4xl"
        scrollBehavior="inside"
        className="h-[60vh]"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <UserPlusIcon className="w-5 h-5" />
              Přidat člena do soupisky
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Search */}
              <Input
                placeholder="Hledat člena..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startContent={<SearchIcon className="w-4 h-4" />}
                className="w-full"
              />

              {/* Add New Member Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Vyberte člena</h3>
                <Button
                  color="primary"
                  variant="bordered"
                  size="sm"
                  startContent={<UserPlusIcon className="w-4 h-4" />}
                  onPress={() => setIsCreateMemberModalOpen(true)}
                >
                  Přidat nového člena
                </Button>
              </div>

              {/* Member Selection */}
              {membersLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    {searchTerm
                      ? 'Žádní členové neodpovídají vyhledávání'
                      : 'Žádní dostupní členové'}
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
                <Table
                  aria-label="Available members"
                  className="w-full h-max-60"
                  selectionMode="single"
                >
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
                            onValueChange={(checked) => setSelectedMember(checked ? member.id : '')}
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

              {/* Member Details Form */}
              {selectedMemberData && (
                <Card>
                  <CardBody>
                    <h3 className="text-lg font-semibold mb-4">Nastavení člena</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Position */}
                      <Select
                        label="Pozice"
                        placeholder="Vyberte pozici"
                        selectedKeys={position ? [position] : []}
                        onSelectionChange={(keys) =>
                          setPosition(Array.from(keys)[0] as 'goalkeeper' | 'field_player')
                        }
                        isRequired
                      >
                        <SelectItem key="goalkeeper">Brankář</SelectItem>
                        <SelectItem key="field_player">Hráč v poli</SelectItem>
                      </Select>

                      {/* Jersey Number */}
                      <Select
                        label="Číslo dresu"
                        placeholder="Vyberte číslo"
                        selectedKeys={jerseyNumber ? [jerseyNumber] : []}
                        onSelectionChange={(keys) => setJerseyNumber(Array.from(keys)[0] as string)}
                        aria-label="Jersey number selection"
                      >
                        {availableJerseyNumbers.map((number) => (
                          <SelectItem key={number.toString()}>{number}</SelectItem>
                        ))}
                      </Select>
                    </div>

                    {/* Roles */}
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
                          <strong>Jméno:</strong> {selectedMemberData.name}{' '}
                          {selectedMemberData.surname}
                        </div>
                        <div>
                          <strong>Reg. číslo:</strong> {selectedMemberData.registration_number}
                        </div>
                        <div>
                          <strong>Pozice:</strong>{' '}
                          {position === 'goalkeeper' ? 'Brankář' : 'Hráč v poli'}
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
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleClose} isDisabled={isSubmitting}>
              Zrušit
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isDisabled={!selectedMember || isSubmitting}
              isLoading={isSubmitting}
            >
              Přidat člena
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Member Modal */}
      <CreateMemberModal
        isOpen={isCreateMemberModalOpen}
        onClose={() => setIsCreateMemberModalOpen(false)}
        onMemberCreated={handleMemberCreated}
        selectedCategoryId={selectedCategoryId}
        selectedCategoryName={selectedCategoryName}
      />
    </>
  );
}

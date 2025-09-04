"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useMembers } from "@/hooks/useMembers";
import { MeetingAttendeeFormData } from "@/types";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox,
  Input,
  Chip,
  Card,
  CardBody,
  Select,
  SelectItem,
  Divider,
} from "@heroui/react";
import { 
  MagnifyingGlassIcon, 
  UserPlusIcon, 
  CheckIcon,
  XMarkIcon,
  UserIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { translations } from "@/lib/translations";

interface AttendeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendees: MeetingAttendeeFormData[];
  onAttendeesChange: (attendees: MeetingAttendeeFormData[]) => void;
}

export function AttendeesModal({
  isOpen,
  onClose,
  attendees,
  onAttendeesChange,
}: AttendeesModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const { members, loading: membersLoading } = useMembers();
  const t = translations.components.meetingMinutes;

  // Filter members based on search
  const filteredMembers = useMemo(() => {
    if (!searchTerm) return members;
    
    return members.filter(member => {
      const fullName = `${member.name} ${member.surname}`.toLowerCase();
      const registrationNumber = member.registration_number.toLowerCase();
      const searchQuery = searchTerm.toLowerCase();
      
      return fullName.includes(searchQuery) || registrationNumber.includes(searchQuery);
    });
  }, [members, searchTerm]);

  // Pagination for filtered members
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter attendees based on status
  const filteredAttendees = useMemo(() => {
    if (statusFilter === "all") return attendees;
    return attendees.filter(attendee => attendee.status === statusFilter);
  }, [attendees, statusFilter]);

  // Initialize selected members from existing attendees
  useEffect(() => {
    if (isOpen) {
      const existingMemberIds = new Set(attendees.map(a => a.user_id).filter(Boolean));
      setSelectedMembers(existingMemberIds);
    }
  }, [isOpen, attendees]);

  const handleMemberToggle = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleBulkAdd = () => {
    const newAttendees: MeetingAttendeeFormData[] = Array.from(selectedMembers)
      .filter(memberId => !attendees.some(a => a.user_id === memberId))
      .map(memberId => {
        const member = members.find(m => m.id === memberId);
        return {
          user_id: memberId,
          status: "present" as const,
          notes: "",
        };
      });

    onAttendeesChange([...attendees, ...newAttendees]);
    setSelectedMembers(new Set());
    setSearchTerm("");
  };

  const handleRemoveAttendee = (index: number) => {
    const newAttendees = attendees.filter((_, i) => i !== index);
    onAttendeesChange(newAttendees);
  };

  const handleStatusChange = (index: number, status: "present" | "excused") => {
    const newAttendees = [...attendees];
    newAttendees[index].status = status;
    onAttendeesChange(newAttendees);
  };

  const handleNotesChange = (index: number, notes: string) => {
    const newAttendees = [...attendees];
    newAttendees[index].notes = notes;
    onAttendeesChange(newAttendees);
  };

  const getMemberDisplayName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member ? `${member.name} ${member.surname} (${member.registration_number})` : "Neznámý člen";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <UserPlusIcon className="w-6 h-6" />
            <h2 className="text-xl font-semibold">{t.manageAttendees}</h2>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-6">
          {/* Search and Add Section */}
          <Card>
            <CardBody>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="Hledat členy..."
                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    className="flex-1"
                  />
                  <Button
                    color="primary"
                    startContent={<UserPlusIcon className="w-4 h-4" />}
                    onPress={handleBulkAdd}
                    isDisabled={selectedMembers.size === 0}
                  >
                    Přidat vybrané ({selectedMembers.size})
                  </Button>
                </div>

                {/* Members List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      {searchTerm ? `Nalezeno ${filteredMembers.length} členů` : `Celkem ${members.length} členů`}
                    </span>
                    {totalPages > 1 && (
                      <span>
                        Stránka {currentPage} z {totalPages}
                      </span>
                    )}
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {paginatedMembers.map((member) => {
                      const isSelected = selectedMembers.has(member.id);
                      const isAlreadyAdded = attendees.some(a => a.user_id === member.id);
                      
                      return (
                        <div
                          key={member.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                          } ${isAlreadyAdded ? 'opacity-50' : 'hover:bg-gray-100'}`}
                        >
                          <Checkbox
                            isSelected={isSelected}
                            onValueChange={() => handleMemberToggle(member.id)}
                            isDisabled={isAlreadyAdded}
                          />
                          <div className="flex-1">
                            <div className="font-medium">
                              {member.name} {member.surname}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.registration_number}
                            </div>
                          </div>
                          {isAlreadyAdded && (
                            <Chip size="sm" color="success" variant="flat" aria-label={t.added} startContent={<CheckIcon className="w-3 h-3" />}>
                              {t.added}
                            </Chip>
                          )}
                        </div>
                      );
                    })}
                    
                    {paginatedMembers.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <UserIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>{t.noMembersFound}</p>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        isDisabled={currentPage === 1}
                      >
                        {t.previous}
                      </Button>
                      
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              size="sm"
                              variant={currentPage === pageNum ? "solid" : "flat"}
                              color={currentPage === pageNum ? "primary" : "default"}
                              onPress={() => setCurrentPage(pageNum)}
                              className="w-8 h-8 min-w-8"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        isDisabled={currentPage === totalPages}
                      >
                        {t.next}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          <Divider />

          {/* Current Attendees */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t.currentAttendees} ({attendees.length})</h3>
              <Select
                size="sm"
                placeholder={t.filtersByStatus}
                selectedKeys={[statusFilter]}
                onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
                className="w-48"
              >
                <SelectItem key="all">{t.all}</SelectItem>
                <SelectItem key="present">{t.present}</SelectItem>
                <SelectItem key="excused">{t.excused}</SelectItem>
              </Select>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-2 h-[300px] overflow-y-auto py-2">
                {filteredAttendees.map((attendee, index) => (
                  <Card key={`${attendee.user_id}-${index}`} className="hover:shadow-md transition-shadow mx-2">
                    <CardBody className="p-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                        <div className="md:col-span-1">
                          <div className="font-medium text-sm">
                            {getMemberDisplayName(attendee.user_id)}
                          </div>
                        </div>

                        <Select
                          size="sm"
                          selectedKeys={[attendee.status]}
                          onSelectionChange={(keys) => {
                            const status = Array.from(keys)[0] as "present" | "excused";
                            handleStatusChange(index, status);
                          }}
                          className="w-full"
                        >
                          <SelectItem key="present">{t.present}</SelectItem>
                          <SelectItem key="excused">{t.excused}</SelectItem>
                        </Select>

                        <Input
                          size="sm"
                          placeholder="Poznámky (volitelné)"
                          value={attendee.notes}
                          onValueChange={(value) => handleNotesChange(index, value)}
                          className="w-full"
                        />

                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            isIconOnly
                            onPress={() => handleRemoveAttendee(index)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}

                {filteredAttendees.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <UserPlusIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>{t.noMembersFound}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button color="primary" onPress={onClose}>
            {translations.button.save}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

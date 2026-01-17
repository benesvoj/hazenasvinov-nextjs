'use client';

import React, {useEffect, useState} from 'react';

import {
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from '@heroui/react';

import {TrashIcon, UserIcon} from '@heroicons/react/24/outline';

import {showToast} from '@/components';
import {useAuth, useFetchMembers, useFetchSeasons, useSeasonFiltering} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {MeetingMinutes, MeetingMinutesFormData} from '@/types';

import {AttendeesModal} from './AttendeesModal';

interface MeetingMinutesFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: MeetingMinutesFormData) => void;
  meetingMinutes?: MeetingMinutes | null;
  getNextMeetingNumber: (year: number) => Promise<number>;
}

export function MeetingMinutesFormModal({
  isOpen,
  onClose,
  onSubmit,
  meetingMinutes,
  getNextMeetingNumber,
}: MeetingMinutesFormModalProps) {
  const [formData, setFormData] = useState<MeetingMinutesFormData>({
    meeting_number: 1,
    meeting_date: '',
    meeting_place: '',
    season_id: '',
    wrote_by: '',
    attachment_url: '',
    attachment_filename: '',
    attendees: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);

  const {data: seasons, loading: seasonsLoading, refetch: fetchAllSeasons} = useFetchSeasons();
  const {activeSeason} = useSeasonFiltering({seasons: seasons});
  const {user} = useAuth();
  const {data: members} = useFetchMembers();

  const t = translations.components.meetingMinutes;

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(API_ROUTES.users);
        const data = await response.json();
        // The API returns users directly, not wrapped in a users property
        setUsers(Array.isArray(data) ? data : data.users || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  // Fetch seasons when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllSeasons();
    }
  }, [isOpen, fetchAllSeasons]);

  // Reset form when modal opens/closes or meetingMinute changes
  useEffect(() => {
    if (isOpen) {
      if (meetingMinutes) {
        setFormData({
          meeting_number: meetingMinutes.meeting_number,
          meeting_date: meetingMinutes.meeting_date,
          meeting_place: meetingMinutes.meeting_place || '',
          season_id: meetingMinutes.season_id || '',
          wrote_by: meetingMinutes.wrote_by || '',
          attachment_url: meetingMinutes.attachment_url || '',
          attachment_filename: meetingMinutes.attachment_filename || '',
          attendees:
            meetingMinutes.attendees?.map((attendee) => ({
              user_id: attendee.user_id,
              status: attendee.status,
              notes: attendee.notes || '',
            })) || [],
        });
      } else {
        // Set default values for new meeting minutes
        const currentYear = new Date().getFullYear();
        getNextMeetingNumber(currentYear).then((nextNumber) => {
          setFormData({
            meeting_number: nextNumber,
            meeting_date: new Date().toISOString().split('T')[0],
            meeting_place: '',
            season_id: activeSeason?.id || '',
            wrote_by: user?.id || '',
            attachment_url: '',
            attachment_filename: '',
            attendees: [],
          });
        });
      }
      setErrors({});
    }
  }, [isOpen, meetingMinutes, getNextMeetingNumber, user?.id, activeSeason?.id]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.meeting_number || formData.meeting_number < 1) {
      newErrors.meeting_number = t.errors.meetingNumberRequired;
    }

    if (!formData.meeting_date) {
      newErrors.meeting_date = t.errors.meetingDateRequired;
    }

    if (!formData.wrote_by) {
      newErrors.wrote_by = t.errors.wroteByRequired;
    }

    if (formData.attendees.length === 0) {
      newErrors.attendees = t.errors.attendeesRequired;
    } else {
      // Check if all attendees have valid user_id
      const invalidAttendees = formData.attendees.filter((attendee: any) => !attendee.user_id);
      if (invalidAttendees.length > 0) {
        newErrors.attendees = 'Všichni účastníci musí mít vybraného člena';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof MeetingMinutesFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const removeAttendee = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attendees: prev.attendees.filter((_, i) => i !== index),
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      showToast.danger(t.errors.invalidFile);
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showToast.danger(t.errors.fileTooLarge);
      return;
    }

    try {
      // In a real implementation, you would upload the file to a storage service
      // For now, we'll just set the filename
      setFormData((prev) => ({
        ...prev,
        attachment_filename: file.name,
        attachment_url: `#${file.name}`, // Placeholder URL
      }));

      showToast.success('Soubor byl připraven k nahrání');
    } catch (error) {
      showToast.danger(t.errors.uploadFailed);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-semibold">
            {meetingMinutes ? t.editMeetingMinutes : t.addMeetingMinutes}
          </h2>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t.meetingNumber}
                type="number"
                value={formData.meeting_number.toString()}
                onValueChange={(value) => handleInputChange('meeting_number', parseInt(value) || 1)}
                isInvalid={!!errors.meeting_number}
                errorMessage={errors.meeting_number}
                isRequired
              />

              <Input
                label={t.meetingDate}
                type="date"
                value={formData.meeting_date}
                onValueChange={(value) => handleInputChange('meeting_date', value)}
                isInvalid={!!errors.meeting_date}
                errorMessage={errors.meeting_date}
                isRequired
              />

              <Input
                label={t.meetingPlace}
                placeholder={t.meetingPlacePlaceholder}
                value={formData.meeting_place}
                onValueChange={(value) => handleInputChange('meeting_place', value)}
              />

              <Select
                label={t.season}
                placeholder="Vyberte sezónu (volitelné)"
                selectedKeys={formData.season_id ? [formData.season_id] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  handleInputChange('season_id', selected);
                }}
                isLoading={seasonsLoading}
                items={seasons.map((season) => ({
                  key: season.id,
                  label: season.name,
                }))}
              >
                {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
              </Select>

              <Select
                label={t.wroteBy}
                placeholder="Vyberte zapisovatele"
                selectedKeys={formData.wrote_by ? [formData.wrote_by] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  handleInputChange('wrote_by', selected);
                }}
                isInvalid={!!errors.wrote_by}
                errorMessage={errors.wrote_by}
                isRequired
                items={users.map((user) => ({
                  key: user.id,
                  label: user.user_metadata?.full_name || user.email,
                }))}
              >
                {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
              </Select>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.attachment}
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {formData.attachment_filename && (
                  <Chip size="sm" className="mt-2">
                    {formData.attachment_filename}
                  </Chip>
                )}
              </div>
            </div>

            <Divider />

            {/* Attendees */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t.attendees}</h3>
                <Button
                  size="sm"
                  color="primary"
                  startContent={<UserIcon className="w-4 h-4" />}
                  onPress={() => setIsAttendeesModalOpen(true)}
                >
                  Správa účastníků ({formData.attendees.length})
                </Button>
              </div>

              {formData.attendees.length === 0 ? (
                <Card>
                  <CardBody>
                    <div className="text-center py-8">
                      <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">{t.noAttendees}</h4>
                      <p className="text-gray-500 mb-4">{t.noAttendeesDescription}</p>
                      <Button
                        color="primary"
                        startContent={<UserIcon className="w-4 h-4" />}
                        onPress={() => setIsAttendeesModalOpen(true)}
                      >
                        {t.addAttendee}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ) : (
                <Card>
                  <CardBody className="p-4 col-span-2 h-[300px] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {formData.attendees.map((attendee, index) => {
                        const member = members.find((m) => m.id === attendee.user_id);
                        return (
                          <Card
                            key={`${attendee.user_id}-${index}`}
                            className="hover:shadow-md transition-shadow"
                          >
                            <CardBody className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {member ? `${member.name} ${member.surname}` : 'Neznámý člen'}
                                  </div>
                                  <div className="text-xs text-gray-500 mb-2">
                                    {member?.registration_number}
                                  </div>
                                  <Chip
                                    size="sm"
                                    color={attendee.status === 'present' ? 'success' : 'warning'}
                                    variant="flat"
                                  >
                                    {attendee.status === 'present' ? t.present : t.excused}
                                  </Chip>
                                  {attendee.notes && (
                                    <div className="text-xs text-gray-600 mt-2">
                                      {attendee.notes}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="flat"
                                  isIconOnly
                                  onPress={() => removeAttendee(index)}
                                >
                                  <TrashIcon className="w-3 h-3" />
                                </Button>
                              </div>
                            </CardBody>
                          </Card>
                        );
                      })}
                    </div>
                  </CardBody>
                </Card>
              )}

              {errors.attendees && <p className="text-red-500 text-sm mt-2">{errors.attendees}</p>}
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="light" onPress={onClose} disabled={isSubmitting}>
              Zrušit
            </Button>
            <Button color="primary" type="submit" isLoading={isSubmitting}>
              {meetingMinutes ? 'Uložit změny' : 'Vytvořit zápis'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>

      {/* Attendees Management Modal */}
      <AttendeesModal
        isOpen={isAttendeesModalOpen}
        onClose={() => setIsAttendeesModalOpen(false)}
        attendees={formData.attendees}
        onAttendeesChange={(newAttendees) => {
          setFormData((prev) => ({
            ...prev,
            attendees: newAttendees,
          }));
        }}
      />
    </Modal>
  );
}

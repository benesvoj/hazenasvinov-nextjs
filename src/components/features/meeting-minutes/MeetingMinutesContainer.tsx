'use client';

import {useEffect, useState, forwardRef, useImperativeHandle} from 'react';

import {Card, CardHeader, CardBody, Input, Select, SelectItem, Button} from '@heroui/react';

import {
  DocumentTextIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import {
  MeetingMinutesFormModal,
  DeleteConfirmationModal,
  showToast,
  LoadingSpinner,
  AttendeesModal,
  MeetingMinutesCard,
} from '@/components';
import {useFetchSeasons, useMeetingMinutes} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {
  MeetingMinutes,
  MeetingMinutesFilters,
  MeetingMinutesContainerProps,
  MeetingMinutesContainerRef,
} from '@/types';

export const MeetingMinutesContainer = forwardRef<
  MeetingMinutesContainerRef,
  MeetingMinutesContainerProps
>(({onAddMeetingMinutes}, ref) => {
  const [filters, setFilters] = useState<MeetingMinutesFilters>({});
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMeetingMinutes, setEditingMeetingMinutes] = useState<MeetingMinutes | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [meetingMinutesToDelete, setMeetingMinutesToDelete] = useState<MeetingMinutes | null>(null);
  const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
  const [editingAttendeesMeeting, setEditingAttendeesMeeting] = useState<MeetingMinutes | null>(
    null
  );

  const {
    meetingMinutes,
    loading,
    error,
    fetchMeetingMinutes,
    createMeetingMinutes,
    updateMeetingMinutes,
    deleteMeetingMinutes,
    getNextMeetingNumber,
  } = useMeetingMinutes();
  const {data: seasons, loading: seasonsLoading, refetch: fetchAllSeasons} = useFetchSeasons();

  const [users, setUsers] = useState<any[]>([]);
  const t = translations.components.meetingMinutes;

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    openCreateModal,
  }));

  // Fetch data on mount
  useEffect(() => {
    fetchMeetingMinutes(filters);
    fetchAllSeasons();
  }, [fetchMeetingMinutes, fetchAllSeasons, filters]);

  //   TODO: typizovat users
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

  const handleFilterChange = (key: keyof MeetingMinutesFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  const handleSearch = () => {
    fetchMeetingMinutes(filters);
  };

  const handleClearFilters = () => {
    setFilters({});
    fetchMeetingMinutes({});
  };

  const openCreateModal = () => {
    setEditingMeetingMinutes(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (meetingMinutes: MeetingMinutes) => {
    setEditingMeetingMinutes(meetingMinutes);
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (meetingMinutes: MeetingMinutes) => {
    setMeetingMinutesToDelete(meetingMinutes);
    setDeleteModalOpen(true);
  };

  const openEditAttendeesModal = (meetingMinutes: MeetingMinutes) => {
    setEditingAttendeesMeeting(meetingMinutes);
    setIsAttendeesModalOpen(true);
  };

  const closeModals = () => {
    setIsFormModalOpen(false);
    setEditingMeetingMinutes(null);
    setDeleteModalOpen(false);
    setMeetingMinutesToDelete(null);
    setIsAttendeesModalOpen(false);
    setEditingAttendeesMeeting(null);
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      if (editingMeetingMinutes) {
        await updateMeetingMinutes(editingMeetingMinutes.id, formData);
        showToast.success(t.success.updated);
      } else {
        await createMeetingMinutes(formData);
        showToast.success(t.success.created);
      }
      closeModals();
    } catch (error) {
      showToast.danger('Chyba při ukládání zápisu');
    }
  };

  const handleDelete = async () => {
    if (!meetingMinutesToDelete) return;

    try {
      await deleteMeetingMinutes(meetingMinutesToDelete.id);
      showToast.success(t.success.deleted);
      closeModals();
    } catch (error) {
      showToast.danger('Chyba při mazání zápisu');
    }
  };

  const handleAttendeesUpdate = async (attendees: any[]) => {
    if (!editingAttendeesMeeting) return;

    try {
      // Convert attendees to the format expected by updateMeetingMinutes
      const attendeesData = attendees.map((attendee) => ({
        user_id: attendee.user_id,
        status: attendee.status,
        notes: attendee.notes || '',
      }));

      await updateMeetingMinutes(editingAttendeesMeeting.id, {
        attendees: attendeesData,
      });

      showToast.success('Účastníci byli úspěšně aktualizováni');
      closeModals();
    } catch (error) {
      showToast.danger('Chyba při aktualizaci účastníků');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5" />
            <h3 className="text-lg font-semibold">{t.filters.title}</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder={t.filters.search}
              startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
              value={filters.search || ''}
              onValueChange={(value) => handleFilterChange('search', value)}
            />

            <Select
              placeholder={t.filters.season}
              selectedKeys={filters.season_id ? [filters.season_id] : ['all']}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                handleFilterChange('season_id', selected);
              }}
              items={[
                {key: 'all', label: t.filters.allSeasons},
                ...seasons.map((season) => ({
                  key: season.id,
                  label: season.name,
                })),
              ]}
            >
              {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
            </Select>

            <Select
              placeholder={t.filters.wroteBy}
              selectedKeys={filters.wrote_by ? [filters.wrote_by] : ['all']}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                handleFilterChange('wrote_by', selected);
              }}
              items={[
                {key: 'all', label: t.filters.allUsers},
                ...users.map((user) => ({
                  key: user.id,
                  label: user.user_metadata?.full_name || user.email,
                })),
              ]}
            >
              {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
            </Select>

            <div className="flex gap-2">
              <Button color="primary" onPress={handleSearch}>
                {t.filters.search}
              </Button>
              <Button variant="flat" onPress={handleClearFilters}>
                {t.filters.clear}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Error State */}
      {error && (
        <Card>
          <CardBody>
            <div className="text-center text-red-600">
              <p>{error}</p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4">
          {meetingMinutes.map((meeting) => (
            <MeetingMinutesCard
              key={meeting.id}
              meeting={meeting}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
              onEditAttendees={openEditAttendeesModal}
            />
          ))}
        </div>
      )}

      {/* Meeting Minutes List */}
      {meetingMinutes.length === 0 && !loading && (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.noMeetingMinutes}</h3>
              <p className="text-gray-600 mb-4">{t.noMeetingMinutesDescription}</p>
              <Button
                color="primary"
                startContent={<PlusIcon className="w-5 h-5" />}
                onPress={openCreateModal}
              >
                {t.addFirstMeetingMinutes}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Form Modal */}
      <MeetingMinutesFormModal
        isOpen={isFormModalOpen}
        onClose={closeModals}
        onSubmit={handleFormSubmit}
        meetingMinutes={editingMeetingMinutes}
        getNextMeetingNumber={getNextMeetingNumber}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeModals}
        onConfirm={handleDelete}
        title={t.deleteMeetingMinutes}
        message={`Opravdu chcete smazat zápis ze schůze #{meetingMinutesToDelete?.meeting_number}? Tato akce je nevratná.`}
      />

      {/* Attendees Management Modal */}
      {editingAttendeesMeeting && (
        <AttendeesModal
          isOpen={isAttendeesModalOpen}
          onClose={closeModals}
          attendees={
            editingAttendeesMeeting.attendees?.map((attendee) => ({
              user_id: attendee.member?.id || attendee.user_id,
              status: attendee.status,
              notes: attendee.notes || '',
            })) || []
          }
          onAttendeesChange={handleAttendeesUpdate}
        />
      )}
    </div>
  );
});

MeetingMinutesContainer.displayName = 'MeetingMinutesContainer';

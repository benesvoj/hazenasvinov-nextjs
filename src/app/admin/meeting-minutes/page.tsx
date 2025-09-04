"use client";

import React, { useState, useEffect } from "react";
import { useMeetingMinutes } from "@/hooks/useMeetingMinutes";
import { useSeasons } from "@/hooks/useSeasons";
import { useAuth } from "@/hooks/useAuth";
import { MeetingMinutes, MeetingMinutesFilters } from "@/types";
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Skeleton,
} from "@heroui/react";
import { AdminContainer } from "../components/AdminContainer";
import { translations } from "@/lib/translations";
import { showToast } from "@/components/Toast";
import { DeleteConfirmationModal, MeetingMinutesFormModal, MeetingMinutesCard } from "@/components";
import { AttendeesModal } from "@/components/meetingMinutes/AttendeesModal";

export default function MeetingMinutesPage() {
  const [filters, setFilters] = useState<MeetingMinutesFilters>({});
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMeetingMinutes, setEditingMeetingMinutes] = useState<MeetingMinutes | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [meetingMinutesToDelete, setMeetingMinutesToDelete] = useState<MeetingMinutes | null>(null);
  const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
  const [editingAttendeesMeeting, setEditingAttendeesMeeting] = useState<MeetingMinutes | null>(null);

  const { meetingMinutes, loading, error, fetchMeetingMinutes, createMeetingMinutes, updateMeetingMinutes, deleteMeetingMinutes, getNextMeetingNumber } = useMeetingMinutes();
  const { seasons, loading: seasonsLoading, fetchSeasonsWithActive } = useSeasons();

  const t = translations.components.meetingMinutes;

  // Fetch data on mount
  useEffect(() => {
    fetchMeetingMinutes(filters);
    fetchSeasonsWithActive();
  }, [fetchMeetingMinutes, fetchSeasonsWithActive]);

  // Fetch users for the wrote_by filter
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/get-users');
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
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
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
      const attendeesData = attendees.map(attendee => ({
        user_id: attendee.user_id,
        status: attendee.status,
        notes: attendee.notes || ""
      }));

      await updateMeetingMinutes(editingAttendeesMeeting.id, {
        attendees: attendeesData
      });
      
      showToast.success('Účastníci byli úspěšně aktualizováni');
      closeModals();
    } catch (error) {
      showToast.danger('Chyba při aktualizaci účastníků');
    }
  };


  if (loading && meetingMinutes.length === 0) {
    return (
      <AdminContainer
        title={t.title}
        description={t.description}
        icon={<DocumentTextIcon className="w-8 h-8 text-blue-600" />}
      >
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardBody>
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded mt-2" />
                <Skeleton className="h-4 w-1/4 rounded mt-2" />
              </CardBody>
            </Card>
          ))}
        </div>
      </AdminContainer>
    );
  }

  return (
    <AdminContainer
      title={t.title}
      description={t.description}
      icon={<DocumentTextIcon className="w-8 h-8 text-blue-600" />}
      actions={
        <Button
          color="primary"
          startContent={<PlusIcon className="w-5 h-5" />}
          onPress={openCreateModal}
        >
          {t.addMeetingMinutes}
        </Button>
      }
    >
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Filtry</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Hledat..."
              startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
              value={filters.search || ""}
              onValueChange={(value) => handleFilterChange('search', value)}
            />
            
            <Select
              placeholder={t.filters.season}
              selectedKeys={filters.season_id ? [filters.season_id] : ["all"]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                handleFilterChange('season_id', selected);
              }}
              items={[
                { key: "all", label: t.filters.allSeasons },
                ...seasons.map(season => ({ key: season.id, label: season.name }))
              ]}
            >
              {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
            </Select>

            <Select
              placeholder={t.filters.wroteBy}
              selectedKeys={filters.wrote_by ? [filters.wrote_by] : ["all"]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                handleFilterChange('wrote_by', selected);
              }}
              items={[
                { key: "all", label: t.filters.allUsers },
                ...users.map(user => ({ key: user.id, label: user.user_metadata?.full_name || user.email }))
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

      {/* Meeting Minutes List */}
      {meetingMinutes.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t.noMeetingMinutes}
              </h3>
              <p className="text-gray-600 mb-4">
                {t.noMeetingMinutesDescription}
              </p>
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
          attendees={editingAttendeesMeeting.attendees?.map(attendee => ({
            user_id: attendee.member?.id || attendee.user_id,
            status: attendee.status,
            notes: attendee.notes || ""
          })) || []}
          onAttendeesChange={handleAttendeesUpdate}
        />
      )}
    </AdminContainer>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useMeetingMinutes } from "@/hooks/useMeetingMinutes";
import { useSeasons } from "@/hooks/useSeasons";
import { MeetingMinutes, MeetingMinutesFilters } from "@/types";
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  UserIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Chip,
  Badge,
  Skeleton,
} from "@heroui/react";
import { translations } from "@/lib/translations";

export default function CoachMeetingMinutesPage() {
  const [filters, setFilters] = useState<MeetingMinutesFilters>({});
  const { meetingMinutes, loading, error, fetchMeetingMinutes } = useMeetingMinutes();
  const { seasons, loading: seasonsLoading, fetchAllSeasons } = useSeasons();

  const t = translations.components.meetingMinutes;

  // Fetch data on mount
  useEffect(() => {
    fetchMeetingMinutes(filters);
    fetchAllSeasons();
  }, [fetchMeetingMinutes, fetchAllSeasons]);

  // Fetch users for the wrote_by filter
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/get-users');
        const data = await response.json();
        setUsers(data.users || []);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("cs-CZ");
  };

  const getStatusColor = (status: string) => {
    return status === 'present' ? 'success' : 'warning';
  };

  const getStatusText = (status: string) => {
    return status === 'present' ? t.present : t.excused;
  };

  if (loading && meetingMinutes.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <DocumentTextIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          </div>
          <p className="text-gray-600">{t.description}</p>
        </div>
        
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
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <DocumentTextIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        </div>
        <p className="text-gray-600">{t.description}</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
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
            >
              <SelectItem key="all">{t.filters.allSeasons}</SelectItem>
              {seasons.map((season) => (
                <SelectItem key={season.id}>{season.name}</SelectItem>
              ))}
            </Select>

            <Select
              placeholder={t.filters.wroteBy}
              selectedKeys={filters.wrote_by ? [filters.wrote_by] : ["all"]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                handleFilterChange('wrote_by', selected);
              }}
            >
              <SelectItem key="all">{t.filters.allUsers}</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id}>{user.full_name || user.email}</SelectItem>
              ))}
            </Select>

            <div className="flex gap-2">
              <Button color="primary" onPress={handleSearch}>
                Hledat
              </Button>
              <Button variant="flat" onPress={handleClearFilters}>
                Vymazat
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-6">
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
                Žádné zápisy
              </h3>
              <p className="text-gray-600">
                Zatím nejsou k dispozici žádné zápisy z výborových schůzí.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {meetingMinutes.map((meeting) => (
            <Card key={meeting.id} className="hover:shadow-lg transition-shadow">
              <CardBody>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Schůze #{meeting.meeting_number}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      {formatDate(meeting.meeting_date)}
                    </div>
                    {meeting.meeting_place && (
                      <div className="flex items-center gap-1">
                        <span>📍</span>
                        {meeting.meeting_place}
                      </div>
                    )}
                    {meeting.season && (
                      <Chip size="sm" variant="flat" color="primary">
                        {meeting.season.name}
                      </Chip>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{t.meetingDetails}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span>Zapsal: {meeting.wrote_by_user?.full_name || meeting.wrote_by_user?.email}</span>
                      </div>
                      {meeting.attachment_url && (
                        <div className="flex items-center gap-2">
                          <DocumentArrowDownIcon className="w-4 h-4 text-gray-400" />
                          <a
                            href={meeting.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {meeting.attachment_filename || "Příloha"}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{t.attendanceList}</h4>
                    {meeting.attendees && meeting.attendees.length > 0 ? (
                      <div className="space-y-1">
                        {meeting.attendees.map((attendee) => (
                          <div key={attendee.id} className="flex items-center justify-between">
                            <span className="text-sm">
                              {attendee.user?.full_name || attendee.user?.email}
                            </span>
                            <Badge
                              color={getStatusColor(attendee.status)}
                              variant="flat"
                              size="sm"
                            >
                              {getStatusText(attendee.status)}
                            </Badge>
                          </div>
                        ))}
                        <div className="pt-2 border-t text-xs text-gray-500">
                          {t.totalAttendees}: {meeting.attendees.length} | 
                          {t.presentCount}: {meeting.attendees.filter(a => a.status === 'present').length} | 
                          {t.excusedCount}: {meeting.attendees.filter(a => a.status === 'excused').length}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">{t.noAttendees}</p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


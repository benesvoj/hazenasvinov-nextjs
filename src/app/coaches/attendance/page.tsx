'use client';

import React, { useState, useEffect } from 'react';
import { useAttendance } from '@/hooks/useAttendance';
import { useSeasons } from '@/hooks/useSeasons';
import { useCategories } from '@/hooks/useCategories';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useMembers } from '@/hooks/useMembers';
import { 
  ClipboardDocumentListIcon,
  PlusIcon,
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Select,
  SelectItem,
  Chip,
  Badge,
  Skeleton,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  Spinner
} from '@heroui/react';
import { TrainingSessionFormData, AttendanceRecord } from '@/types/attendance';
import { formatDate, formatTime } from '@/helpers';

export default function CoachesAttendancePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [sessionFormData, setSessionFormData] = useState<TrainingSessionFormData>({
    title: '',
    description: '',
    session_date: '',
    session_time: '',
    category: '',
    season_id: '',
    location: ''
  });

  const { 
    trainingSessions, 
    attendanceRecords, 
    attendanceSummary,
    loading, 
    error, 
    fetchTrainingSessions, 
    fetchAttendanceRecords,
    fetchAttendanceSummary,
    createTrainingSession,
    updateTrainingSession,
    deleteTrainingSession,
    recordAttendance
  } = useAttendance();

  const { seasons, loading: seasonsLoading } = useSeasons();
  const { categories, loading: categoriesLoading } = useCategories();
  const { getCurrentUserCategories } = useUserRoles();
  const { members, loading: membersLoading, fetchMembers } = useMembers();

  // Get user's assigned categories
  const [userCategories, setUserCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchUserCategories = async () => {
      try {
        const categories = await getCurrentUserCategories();
        setUserCategories(categories);
        if (categories.length > 0 && !selectedCategory) {
          setSelectedCategory(categories[0]);
        }
      } catch (err) {
        console.error('Error fetching user categories:', err);
      }
    };

    fetchUserCategories();
  }, [getCurrentUserCategories, selectedCategory]);

  // Get active season
  const activeSeason = seasons.find(season => season.is_active);

  useEffect(() => {
    if (activeSeason && !selectedSeason) {
      setSelectedSeason(activeSeason.id);
    }
  }, [activeSeason, selectedSeason]);

  // Fetch data when category and season change
  useEffect(() => {
    if (selectedCategory && selectedSeason) {
      fetchTrainingSessions(selectedCategory, selectedSeason);
      fetchAttendanceSummary(selectedCategory, selectedSeason);
    }
  }, [selectedCategory, selectedSeason, fetchTrainingSessions, fetchAttendanceSummary]);

  // Fetch attendance records when session changes
  useEffect(() => {
    if (selectedSession) {
      fetchAttendanceRecords(selectedSession);
    }
  }, [selectedSession, fetchAttendanceRecords]);

  // Filter members by selected category
  const filteredMembers = members.filter(member => member.category === selectedCategory);

  const handleCreateSession = async () => {
    try {
      await createTrainingSession(sessionFormData);
      setIsSessionModalOpen(false);
      setSessionFormData({
        title: '',
        description: '',
        session_date: '',
        session_time: '',
        category: selectedCategory,
        season_id: selectedSeason,
        location: ''
      });
    } catch (err) {
      console.error('Error creating session:', err);
    }
  };

  const handleUpdateSession = async () => {
    if (!editingSession) return;

    try {
      await updateTrainingSession(editingSession.id, sessionFormData);
      setIsSessionModalOpen(false);
      setEditingSession(null);
      setSessionFormData({
        title: '',
        description: '',
        session_date: '',
        session_time: '',
        category: selectedCategory,
        season_id: selectedSeason,
        location: ''
      });
    } catch (err) {
      console.error('Error updating session:', err);
    }
  };

  const handleEditSession = (session: any) => {
    setEditingSession(session);
    setSessionFormData({
      title: session.title,
      description: session.description || '',
      session_date: session.session_date,
      session_time: session.session_time || '',
      category: session.category,
      season_id: session.season_id,
      location: session.location || ''
    });
    setIsSessionModalOpen(true);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (confirm('Opravdu chcete smazat tento trénink?')) {
      try {
        await deleteTrainingSession(sessionId);
        if (selectedSession === sessionId) {
          setSelectedSession('');
        }
      } catch (err) {
        console.error('Error deleting session:', err);
      }
    }
  };

  const handleRecordAttendance = async (memberId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    if (!selectedSession) return;

    try {
      await recordAttendance(memberId, selectedSession, status);
    } catch (err) {
      console.error('Error recording attendance:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'danger';
      case 'late': return 'warning';
      case 'excused': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'Přítomen';
      case 'absent': return 'Nepřítomen';
      case 'late': return 'Pozdní příchod';
      case 'excused': return 'Omluven';
      default: return status;
    }
  };

  if (loading && !trainingSessions.length) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardDocumentListIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Docházka členů</h1>
        </div>
        <p className="text-gray-600">Sledování docházky členů na tréninkové jednotky</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Kategorie"
              placeholder="Vyberte kategorii"
              selectedKeys={selectedCategory ? [selectedCategory] : []}
              onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
              isDisabled={categoriesLoading}
            >
              {userCategories.map((categoryCode) => {
                const category = categories.find(c => c.code === categoryCode);
                return (
                  <SelectItem key={categoryCode} value={categoryCode}>
                    {category?.name || categoryCode}
                  </SelectItem>
                );
              })}
            </Select>

            <Select
              label="Sezóna"
              placeholder="Vyberte sezónu"
              selectedKeys={selectedSeason ? [selectedSeason] : []}
              onSelectionChange={(keys) => setSelectedSeason(Array.from(keys)[0] as string)}
              isDisabled={seasonsLoading}
            >
              {seasons.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name}
                </SelectItem>
              ))}
            </Select>

            <div className="flex items-end">
              <Button
                color="primary"
                startContent={<PlusIcon className="w-4 h-4" />}
                onPress={() => {
                  setEditingSession(null);
                  setSessionFormData({
                    title: '',
                    description: '',
                    session_date: '',
                    session_time: '',
                    category: selectedCategory,
                    season_id: selectedSeason,
                    location: ''
                  });
                  setIsSessionModalOpen(true);
                }}
                isDisabled={!selectedCategory || !selectedSeason}
              >
                Nový trénink
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Training Sessions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Tréninkové jednotky</h3>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : trainingSessions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Žádné tréninky</p>
              ) : (
                <div className="space-y-2">
                  {trainingSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSession === session.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedSession(session.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{session.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <CalendarIcon className="w-3 h-3" />
                            {formatDate(session.session_date)}
                            {session.session_time && (
                              <>
                                <ClockIcon className="w-3 h-3 ml-2" />
                                {formatTime(session.session_time)}
                              </>
                            )}
                          </div>
                          {session.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <MapPinIcon className="w-3 h-3" />
                              {session.location}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="light"
                            onPress={() => handleEditSession(session)}
                          >
                            Upravit
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            onPress={() => handleDeleteSession(session.id)}
                          >
                            Smazat
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Attendance Records */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <h3 className="text-lg font-semibold">Docházka</h3>
                {selectedSession && (
                  <Button
                    size="sm"
                    color="primary"
                    startContent={<UserGroupIcon className="w-4 h-4" />}
                    onPress={() => setIsAttendanceModalOpen(true)}
                  >
                    Zaznamenat docházku
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {!selectedSession ? (
                <p className="text-gray-500 text-center py-8">
                  Vyberte trénink pro zobrazení docházky
                </p>
              ) : loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-lg" />
                  ))}
                </div>
              ) : attendanceRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Žádné záznamy docházky pro tento trénink
                </p>
              ) : (
                <Table aria-label="Attendance records">
                  <TableHeader>
                    <TableColumn>ČLEN</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>AKCE</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {record.member.name} {record.member.surname}
                            </div>
                            <div className="text-sm text-gray-500">
                              {record.member.category}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={getStatusColor(record.attendance_status)}
                            size="sm"
                          >
                            {getStatusText(record.attendance_status)}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {(['present', 'absent', 'late', 'excused'] as const).map((status) => (
                              <Button
                                key={status}
                                size="sm"
                                variant={record.attendance_status === status ? 'solid' : 'light'}
                                color={getStatusColor(status)}
                                onPress={() => handleRecordAttendance(record.member.id, status)}
                              >
                                {getStatusText(status)}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Training Session Modal */}
      <Modal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>
            {editingSession ? 'Upravit trénink' : 'Nový trénink'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Název tréninku"
                placeholder="Zadejte název tréninku"
                value={sessionFormData.title}
                onChange={(e) => setSessionFormData(prev => ({ ...prev, title: e.target.value }))}
                isRequired
              />
              
              <Textarea
                label="Popis"
                placeholder="Zadejte popis tréninku"
                value={sessionFormData.description}
                onChange={(e) => setSessionFormData(prev => ({ ...prev, description: e.target.value }))}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Datum"
                  type="date"
                  value={sessionFormData.session_date}
                  onChange={(e) => setSessionFormData(prev => ({ ...prev, session_date: e.target.value }))}
                  isRequired
                />
                
                <Input
                  label="Čas"
                  type="time"
                  value={sessionFormData.session_time}
                  onChange={(e) => setSessionFormData(prev => ({ ...prev, session_time: e.target.value }))}
                />
              </div>

              <Input
                label="Místo"
                placeholder="Zadejte místo konání"
                value={sessionFormData.location}
                onChange={(e) => setSessionFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setIsSessionModalOpen(false)}
            >
              Zrušit
            </Button>
            <Button
              color="primary"
              onPress={editingSession ? handleUpdateSession : handleCreateSession}
              isDisabled={!sessionFormData.title || !sessionFormData.session_date}
            >
              {editingSession ? 'Uložit změny' : 'Vytvořit trénink'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Attendance Modal */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        size="4xl"
      >
        <ModalContent>
          <ModalHeader>
            Zaznamenat docházku
          </ModalHeader>
          <ModalBody>
            {membersLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <Table aria-label="Members attendance">
                <TableHeader>
                  <TableColumn>ČLEN</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>AKCE</TableColumn>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => {
                    const existingRecord = attendanceRecords.find(r => r.member.id === member.id);
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {member.name} {member.surname}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.registration_number}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {existingRecord && (
                            <Chip
                              color={getStatusColor(existingRecord.attendance_status)}
                              size="sm"
                            >
                              {getStatusText(existingRecord.attendance_status)}
                            </Chip>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {(['present', 'absent', 'late', 'excused'] as const).map((status) => (
                              <Button
                                key={status}
                                size="sm"
                                variant={existingRecord?.attendance_status === status ? 'solid' : 'light'}
                                color={getStatusColor(status)}
                                onPress={() => handleRecordAttendance(member.id, status)}
                              >
                                {getStatusText(status)}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setIsAttendanceModalOpen(false)}
            >
              Zavřít
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

'use client';

import React, {useState, useEffect, useMemo} from 'react';
import {useAttendance, useCategoryLineups} from '@/hooks';
import {useUser} from '@/contexts/UserContext';
import {useAppData} from '@/contexts/AppDataContext';
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Select,
  SelectItem,
  Skeleton,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  Spinner,
} from '@heroui/react';
import {TrainingSessionFormData} from '@/types';
import {formatDateString, formatTime} from '@/helpers';
import {TrainingSessionModal, TrainingSessionGenerator} from './components';
import {DeleteConfirmationModal, PageContainer} from '@/components';

export default function CoachesAttendancePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<any>(null);

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
    recordAttendance,
    createAttendanceForLineupMembers,
  } = useAttendance();

  const {
    seasons,
    categories,
    members,
    activeSeason,
    loading: appDataLoading,
    seasonsLoading,
    categoriesLoading,
    membersLoading,
  } = useAppData();
  const {userCategories, getCurrentUserCategories, isAdmin} = useUser();
  const {
    lineups,
    loading: lineupsLoading,
    fetchLineups,
    lineupMembers,
    fetchLineupMembers,
  } = useCategoryLineups();

  // Get admin category simulation from localStorage (for admin users testing coach portal)
  const [adminSimulationCategories, setAdminSimulationCategories] = useState<string[]>([]);

  useEffect(() => {
    if (isAdmin && typeof window !== 'undefined') {
      const simulationData = localStorage.getItem('adminCategorySimulation');
      if (simulationData) {
        try {
          const {selectedCategories} = JSON.parse(simulationData);
          if (selectedCategories && selectedCategories.length > 0) {
            setAdminSimulationCategories(selectedCategories);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }
  }, [isAdmin]);

  // Get user's assigned categories from UserContext
  // const [userCategories, setUserCategories] = useState<string[]>([]);

  // No need to fetch initial data - AppDataContext handles this

  // Compute available categories for this user
  const availableCategories = useMemo(() => {
    if (adminSimulationCategories.length > 0) {
      // Admin simulation mode - show only selected categories from localStorage
      return adminSimulationCategories
        .map((categoryId: string) => categories.find((c) => c.id === categoryId))
        .filter(Boolean);
    } else if (isAdmin) {
      // Admin users can access all categories
      return categories;
    } else {
      // Regular coaches use their assigned categories
      return userCategories
        .map((categoryId: string) => categories.find((c) => c.id === categoryId))
        .filter(Boolean);
    }
  }, [adminSimulationCategories, categories, isAdmin, userCategories]);

  // Compute the effective selected category (auto-select if only one available)
  const effectiveSelectedCategory = useMemo(() => {
    if (selectedCategory) {
      return selectedCategory;
    }

    // Auto-select if only one category available
    if (availableCategories.length === 1) {
      return availableCategories[0]?.id || '';
    }

    return '';
  }, [selectedCategory, availableCategories]);

  // Fetch lineups when category and season change
  useEffect(() => {
    if (selectedCategory && selectedSeason) {
      fetchLineups(selectedCategory, selectedSeason);
    }
  }, [selectedCategory, selectedSeason, fetchLineups]);

  // Update selectedCategory when effectiveSelectedCategory changes
  useEffect(() => {
    if (effectiveSelectedCategory && effectiveSelectedCategory !== selectedCategory) {
      setSelectedCategory(effectiveSelectedCategory);
    }
  }, [effectiveSelectedCategory, selectedCategory]);

  // Set initial season from AppDataContext
  useEffect(() => {
    if (activeSeason && !selectedSeason) {
      setSelectedSeason(activeSeason.id);
    }
  }, [activeSeason, selectedSeason]);

  // Fetch data when category and season change
  useEffect(() => {
    if (effectiveSelectedCategory && selectedSeason && categories.length > 0) {
      // Use category ID directly (no need to convert to code)
      fetchTrainingSessions(effectiveSelectedCategory, selectedSeason);
      fetchAttendanceSummary(effectiveSelectedCategory, selectedSeason);
    }
  }, [
    effectiveSelectedCategory,
    selectedSeason,
    categories,
    fetchTrainingSessions,
    fetchAttendanceSummary,
  ]);

  // Fetch attendance records when session changes
  useEffect(() => {
    if (selectedSession) {
      fetchAttendanceRecords(selectedSession);
    }
  }, [selectedSession, fetchAttendanceRecords]);

  // Memoize filtered members calculation
  const filteredMembers = useMemo(() => {
    // Get lineup members for the selected category, fallback to filtered members if no lineups
    const lineupMembersList = lineupMembers
      .map((lineupMember) => lineupMember.member)
      .filter(Boolean);

    // Fallback: if no lineup members, filter all members by category
    const fallbackMembers = members.filter((member) => {
      return member.category_id === effectiveSelectedCategory;
    });

    // Use lineup members if available, otherwise use filtered members
    const unsortedMembers = lineupMembersList.length > 0 ? lineupMembersList : fallbackMembers;

    // Sort members by surname, then by name
    return unsortedMembers.sort((a, b) => {
      // Type guard to ensure both members exist
      if (!a || !b) return 0;

      // First sort by surname
      const surnameComparison = (a.surname || '').localeCompare(b.surname || '');
      if (surnameComparison !== 0) {
        return surnameComparison;
      }
      // If surnames are the same, sort by name
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [lineupMembers, members, effectiveSelectedCategory]);

  const handleSessionSubmit = async (sessionData: TrainingSessionFormData) => {
    try {
      // Use category ID directly
      const dataWithCategory = {
        ...sessionData,
        category_id: selectedCategory,
        season_id: selectedSeason,
      };

      if (editingSession) {
        await updateTrainingSession(editingSession.id, dataWithCategory);
        setEditingSession(null);
      } else {
        // Create new training session
        const createdSession = await createTrainingSession(dataWithCategory);

        // Create attendance records for the new session
        try {
          let memberIds: string[] = [];

          // Try to get lineup members first
          try {
            const {createClient} = await import('@/utils/supabase/client');
            const supabase = createClient();

            // First get the lineup for this category and season
            const {data: lineupData, error: lineupError} = await supabase
              .from('category_lineups')
              .select('id')
              .eq('category_id', selectedCategory)
              .eq('season_id', selectedSeason)
              .eq('is_active', true)
              .single();

            if (!lineupError && lineupData) {
              // Then get the lineup members
              const {data: membersData, error: membersError} = await supabase
                .from('category_lineup_members')
                .select(
                  `
                  member_id,
                  members!inner (
                    id,
                    name,
                    surname,
                    category_id
                  )
                `
                )
                .eq('lineup_id', lineupData.id)
                .eq('is_active', true);

              if (!membersError && membersData) {
                memberIds = membersData.map((item: any) => item.member_id).filter(Boolean) || [];
              }
            }
          } catch (err) {
            // Could not fetch lineup members, will use fallback
          }

          if (memberIds.length === 0) {
            // Fallback to filtered members if no lineup members
            const fallbackMembers = members.filter(
              (member) => member.category_id === selectedCategory
            );
            const fallbackMemberIds = fallbackMembers.map((m) => m.id);

            if (fallbackMemberIds.length > 0) {
              await createAttendanceForLineupMembers(
                createdSession.id,
                fallbackMemberIds,
                'present'
              );
            }
          } else {
            await createAttendanceForLineupMembers(createdSession.id, memberIds, 'present');
          }
        } catch (attendanceErr) {
          // Don't fail the session creation if attendance fails
        }
      }

      setIsSessionModalOpen(false);
    } catch (err) {
      console.error('Error saving session:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : 'Unknown',
      });
    }
  };

  const handleEditSession = (session: any) => {
    setEditingSession(session);
    setIsSessionModalOpen(true);
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      await deleteTrainingSession(sessionToDelete);
      if (selectedSession === sessionToDelete) {
        setSelectedSession('');
      }
      setIsDeleteModalOpen(false);
      setSessionToDelete(null);
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const handleRecordAttendance = async (
    memberId: string,
    status: 'present' | 'absent' | 'late' | 'excused'
  ) => {
    if (!selectedSession) return;

    try {
      await recordAttendance(memberId, selectedSession, status);
    } catch (err) {
      console.error('Error recording attendance:', err);
      // Show error to user - you might want to add a toast notification here
      alert(err instanceof Error ? err.message : 'Chyba při zaznamenávání docházky');
    }
  };

  const handleCreateAttendanceForSession = async () => {
    if (!selectedSession || !selectedCategory || !selectedSeason) return;

    try {
      // Get lineup members for the selected category and season
      await fetchLineups(selectedCategory, selectedSeason);
      const memberIds = lineupMembers.map((lm) => lm.member?.id).filter(Boolean) as string[];

      if (memberIds.length === 0) {
        // Fallback to filtered members if no lineup members
        const fallbackMembers = members.filter((member) => member.category_id === selectedCategory);
        const fallbackMemberIds = fallbackMembers.map((m) => m.id);

        if (fallbackMemberIds.length === 0) {
          alert('Žádní členové nejsou k dispozici pro vybranou kategorii');
          return;
        }

        await createAttendanceForLineupMembers(selectedSession, fallbackMemberIds, 'present');
        await fetchAttendanceRecords(selectedSession);
        alert(
          `Vytvořeno ${fallbackMemberIds.length} záznamů docházky pro tento trénink (použiti všichni členové kategorie)`
        );
        return;
      }

      await createAttendanceForLineupMembers(selectedSession, memberIds, 'present');

      // Refresh attendance records
      await fetchAttendanceRecords(selectedSession);

      alert(`Vytvořeno ${memberIds.length} záznamů docházky pro tento trénink`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Chyba při vytváření záznamů docházky');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'success';
      case 'absent':
        return 'danger';
      case 'late':
        return 'warning';
      case 'excused':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'Přítomen';
      case 'absent':
        return 'Nepřítomen';
      case 'late':
        return 'Pozdní příchod';
      case 'excused':
        return 'Omluven';
      default:
        return status;
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
    <PageContainer>
      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 flex-1 lg:w-auto">
              <Select
                label="Kategorie"
                placeholder="Vyberte kategorii"
                selectedKeys={effectiveSelectedCategory ? [effectiveSelectedCategory] : []}
                onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
                isDisabled={categoriesLoading || availableCategories.length === 1}
                defaultSelectedKeys={effectiveSelectedCategory ? [effectiveSelectedCategory] : []}
                className="min-w-0"
              >
                {availableCategories.map((category: any) => (
                  <SelectItem key={category.id}>{category.name}</SelectItem>
                ))}
              </Select>

              <Select
                label="Sezóna"
                placeholder="Vyberte sezónu"
                selectedKeys={selectedSeason ? [selectedSeason] : []}
                onSelectionChange={(keys) => setSelectedSeason(Array.from(keys)[0] as string)}
                isDisabled={seasonsLoading}
                className="min-w-0"
              >
                {seasons.map((season) => (
                  <SelectItem key={season.id}>{season.name}</SelectItem>
                ))}
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
              <Button
                color="primary"
                startContent={<PlusIcon className="w-4 h-4" />}
                onPress={() => {
                  setEditingSession(null);
                  // Small delay to ensure state is reset before opening modal
                  setTimeout(() => {
                    setIsSessionModalOpen(true);
                  }, 0);
                }}
                isDisabled={!selectedCategory || !selectedSeason}
                className="w-full sm:w-auto"
              >
                <span className="hidden sm:inline">Nový trénink</span>
                <span className="sm:hidden">Nový</span>
              </Button>
              <Button
                color="primary"
                variant="bordered"
                startContent={<CalendarIcon className="w-4 h-4" />}
                onPress={() => setIsGeneratorOpen(true)}
                isDisabled={!selectedCategory || !selectedSeason}
                isIconOnly
                aria-label="Generovat tréninky"
                className="w-full sm:w-auto"
              />
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
                            <div>{formatDateString(session.session_date)}</div>
                            {session.session_time && <div>{formatTime(session.session_time)}</div>}
                          </div>
                          {session.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              {session.location}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="light"
                            startContent={<PencilIcon className="w-4 h-4" />}
                            isIconOnly
                            aria-label={`Upravit trénink ${session.title}`}
                            onPress={() => handleEditSession(session)}
                          />
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            onPress={() => handleDeleteSession(session.id)}
                            isIconOnly
                            aria-label={`Upravit trénink ${session.title}`}
                            startContent={<TrashIcon className="w-4 h-4" />}
                          />
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
                <h3 className="text-lg font-semibold">
                  Docházka {attendanceRecords ? `(${attendanceRecords.length})` : ''}
                </h3>
                {selectedSession && attendanceRecords.length === 0 && (
                  <Button
                    size="sm"
                    color="primary"
                    variant="bordered"
                    onPress={handleCreateAttendanceForSession}
                  >
                    Vytvořit záznamy docházky
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
                <div className="overflow-x-auto">
                  <Table aria-label="Attendance records">
                    <TableHeader>
                      <TableColumn>ČLEN</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords
                        .sort((a, b) => {
                          // Sort by surname, then by name
                          if (!a.member || !b.member) return 0;
                          const surnameComparison = (a.member.surname || '').localeCompare(
                            b.member.surname || ''
                          );
                          if (surnameComparison !== 0) {
                            return surnameComparison;
                          }
                          return (a.member.name || '').localeCompare(b.member.name || '');
                        })
                        .map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm sm:text-base">
                                  {record.member.surname} {record.member.name}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {(['present', 'absent', 'late', 'excused'] as const).map(
                                  (status) => (
                                    <Button
                                      key={status}
                                      size="sm"
                                      variant={
                                        record.attendance_status === status ? 'solid' : 'light'
                                      }
                                      color={getStatusColor(status)}
                                      onPress={() =>
                                        handleRecordAttendance(record.member.id, status)
                                      }
                                      className="text-xs sm:text-sm"
                                    >
                                      <span className="hidden sm:inline">
                                        {getStatusText(status)}
                                      </span>
                                      <span className="sm:hidden">
                                        {status === 'present'
                                          ? 'P'
                                          : status === 'absent'
                                            ? 'N'
                                            : status === 'late'
                                              ? 'L'
                                              : 'O'}
                                      </span>
                                    </Button>
                                  )
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Training Session Modal */}
      <TrainingSessionModal
        isOpen={isSessionModalOpen}
        onClose={() => {
          setEditingSession(null);
          setIsSessionModalOpen(false);
        }}
        onSubmit={handleSessionSubmit}
        session={editingSession}
        selectedCategoryId={selectedCategory}
        selectedSeason={selectedSeason}
      />

      {/* Training Session Generator Modal */}
      <TrainingSessionGenerator
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        selectedCategory={selectedCategory}
        selectedSeason={selectedSeason}
        onSuccess={() => {
          // Refresh training sessions after successful generation
          if (selectedCategory && selectedSeason) {
            if (selectedCategory) {
              fetchTrainingSessions(selectedCategory, selectedSeason);
            }
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSessionToDelete(null);
        }}
        onConfirm={confirmDeleteSession}
        title="Smazat trénink"
        message="Opravdu chcete smazat tento trénink? Tato akce je nevratná a smaže také všechny záznamy o docházce."
      />
    </PageContainer>
  );
}

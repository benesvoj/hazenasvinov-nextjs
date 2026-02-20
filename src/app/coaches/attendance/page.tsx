'use client';

export const dynamic = 'force-dynamic';

import React, {useEffect, useMemo, useState} from 'react';

import {Button, Card, CardBody, Select, SelectItem, Tab, Tabs} from '@heroui/react';

import {CalendarIcon, PlusIcon} from '@heroicons/react/24/outline';

import {useAppData} from '@/contexts/AppDataContext';
import {useUser} from '@/contexts/UserContext';

import {DeleteConfirmationModal, LoadingSpinner, PageContainer, showToast} from '@/components';
import {TrainingSessionStatusEnum} from '@/enums';
import {
  useAttendance,
  useFetchCategoryLineupMembers,
  useFetchCategoryLineups,
  useFetchMembersAttendance,
  useFetchTrainingSessions,
  useSupabaseClient,
  useTrainingSession,
} from '@/hooks';
import {TrainingSessionFormData} from '@/types';

import {
  AttendanceRecordingTable,
  AttendanceStatisticsLazy,
  TrainingSessionGenerator,
  TrainingSessionList,
  TrainingSessionModal,
  TrainingSessionStatusDialog,
} from './components';

export default function CoachesAttendancePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [sessionForStatusUpdate, setSessionForStatusUpdate] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'attendance' | 'statistics'>('attendance');

  const supabase = useSupabaseClient();
  const {
    loading,
    fetchAttendanceSummary,
    updateTrainingSessionStatus,
    recordAttendance,
    createAttendanceForLineupMembers,
  } = useAttendance();

  const {createTrainingSession, updateTrainingSession, deleteTrainingSession} =
    useTrainingSession();

  const {
    seasons: {data: seasons, activeSeason},
    categories: {data: categories},
    members: {data: members},
    loading: appDataLoading,
  } = useAppData();

  const {
    data: sessions,
    loading: trainingSessionsLoading,
    refetch: refetchSessions,
  } = useFetchTrainingSessions({
    categoryId: selectedCategory,
    seasonId: selectedSeason,
  });

  const {data: attendanceRecords, refetch: fetchAttendanceRecords} = useFetchMembersAttendance({
    trainingSessionId: selectedSession || '',
  });

  const {userCategories, isAdmin} = useUser();

  // Fetch category lineups to get the active lineup ID
  const {data: lineups, refetch: fetchLineups} = useFetchCategoryLineups({
    categoryId: selectedCategory,
    seasonId: selectedSeason,
  });

  // Find the active lineup for this category/season
  // Note: useFetchCategoryLineupMembers requires a lineup ID, not a session ID
  const activeLineup = useMemo(() => {
    return lineups?.find((lineup) => lineup.is_active) ?? null;
  }, [lineups]);

  // Fetch lineup members using the correct lineup ID (not session ID!)
  const {data: lineupMembers} = useFetchCategoryLineupMembers(
    selectedCategory,
    activeLineup?.id || ''
  );

  // Get admin category simulation from localStorage (for admin users testing coach portal)
  const [adminSimulationCategories, setAdminSimulationCategories] = useState<string[]>([]);

  useEffect(() => {
    if (isAdmin && typeof window !== 'undefined') {
      const simulationData = localStorage.getItem('adminCategorySimulation');
      if (simulationData) {
        try {
          const {selectedCategories} = JSON.parse(simulationData);
          if (selectedCategories && selectedCategories.length > 0) {
            // TODO: refactor - this is a bit hacky but allows admin to simulate being assigned to specific categories without affecting real user data
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAdminSimulationCategories(selectedCategories);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }
  }, [isAdmin]);

  // Get user's assigned category from UserContext
  // const [userCategories, setUserCategories] = useState<string[]>([]);

  // No need to fetch initial data - AppDataContext handles this

  // Compute available category for this user
  const availableCategories = useMemo(() => {
    if (adminSimulationCategories.length > 0) {
      // Admin simulation mode - show only selected category from localStorage
      return adminSimulationCategories
        .map((categoryId: string) => categories.find((c) => c.id === categoryId))
        .filter(Boolean);
    } else if (isAdmin) {
      // Admin users can access all category
      return categories;
    } else {
      // Regular coaches use their assigned category
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
      void fetchLineups();
    }
  }, [selectedCategory, selectedSeason, fetchLineups]);

  // Update selectedCategory when effectiveSelectedCategory changes
  useEffect(() => {
    if (effectiveSelectedCategory && effectiveSelectedCategory !== selectedCategory) {
      //TODO: refactor
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCategory(effectiveSelectedCategory);
    }
  }, [effectiveSelectedCategory, selectedCategory]);

  // Set initial season from AppDataContext
  useEffect(() => {
    if (activeSeason && !selectedSeason) {
      // TODO: refactor
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedSeason(activeSeason.id);
    }
  }, [activeSeason, selectedSeason]);

  // Fetch data when category and season change
  useEffect(() => {
    if (effectiveSelectedCategory && selectedSeason && categories.length > 0) {
      // Use category ID directly (no need to convert to code)
      fetchAttendanceSummary(effectiveSelectedCategory, selectedSeason);
    }
  }, [effectiveSelectedCategory, selectedSeason, categories, fetchAttendanceSummary]);

  // Fetch attendance records when session changes
  useEffect(() => {
    if (selectedSession) {
      fetchAttendanceRecords();
    }
  }, [selectedSession, fetchAttendanceRecords]);

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
        // Refresh the sessions list after update
        await refetchSessions();
      } else {
        // Create new training session
        const createdSession = await createTrainingSession(dataWithCategory);

        await refetchSessions();

        // Check if session was created successfully
        if (!createdSession) {
          showToast.danger('Nepodařilo se vytvořit trénink');
          return;
        }

        // Create attendance records for the new session
        try {
          let memberIds: string[] = [];

          // Try to get lineup members first
          try {
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
      await refetchSessions();
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const handleStatusUpdate = async (status: TrainingSessionStatusEnum, reason?: string) => {
    if (!sessionForStatusUpdate) return;

    try {
      await updateTrainingSessionStatus(sessionForStatusUpdate.id, status, reason);
      setSessionForStatusUpdate(null);
      setIsStatusDialogOpen(false);
    } catch (err) {
      console.error('Error updating session status:', err);
      alert(err instanceof Error ? err.message : 'Chyba při změně stavu tréninku');
    }
  };

  const handleOpenStatusDialog = (session: any) => {
    setSessionForStatusUpdate(session);
    setIsStatusDialogOpen(true);
  };

  const handleRecordAttendance = async (
    memberId: string,
    status: 'present' | 'absent' | 'late' | 'excused'
  ) => {
    if (!selectedSession) return;

    try {
      await recordAttendance(memberId, selectedSession, status);
      await fetchAttendanceRecords();
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
      await fetchLineups();
      const memberIds = lineupMembers.map((lm) => lm.members?.id).filter(Boolean) as string[];

      if (memberIds.length === 0) {
        // Fallback to filtered members if no lineup members
        const fallbackMembers = members.filter((member) => member.category_id === selectedCategory);
        const fallbackMemberIds = fallbackMembers.map((m) => m.id);

        if (fallbackMemberIds.length === 0) {
          showToast.warning('Žádní členové nejsou k dispozici pro vybranou kategorii');
          return;
        }

        await createAttendanceForLineupMembers(selectedSession, fallbackMemberIds, 'present');
        await fetchAttendanceRecords();
        alert(
          `Vytvořeno ${fallbackMemberIds.length} záznamů docházky pro tento trénink (použiti všichni členové kategorie)`
        );
        return;
      }

      await createAttendanceForLineupMembers(selectedSession, memberIds, 'present');

      // Refresh attendance records
      await fetchAttendanceRecords();

      alert(`Vytvořeno ${memberIds.length} záznamů docházky pro tento trénink`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Chyba při vytváření záznamů docházky');
    }
  };

  if (loading || appDataLoading || trainingSessionsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <>
      <PageContainer>
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col lg:flex-row gap-4 justify-between">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 flex-1 lg:w-auto">
                <Select
                  label="Kategorie"
                  placeholder="Vyberte kategorii"
                  selectedKeys={effectiveSelectedCategory ? [effectiveSelectedCategory] : []}
                  onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
                  isDisabled={appDataLoading || availableCategories.length === 1}
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
                  isDisabled={appDataLoading}
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

        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as any)}
          className="mb-6"
          size="lg"
        >
          <Tab key="attendance" title="Docházka">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <TrainingSessionList
                sessions={sessions}
                selectedSession={selectedSession}
                onSelectedSession={setSelectedSession}
                onStatusChnage={handleOpenStatusDialog}
                onEditSession={handleEditSession}
                onDeleteSession={handleDeleteSession}
                loading={trainingSessionsLoading}
              />

              <AttendanceRecordingTable
                attendanceRecords={attendanceRecords}
                selectedSession={selectedSession}
                handleRecordAttendance={handleRecordAttendance}
                handleCreateAttendanceForSession={handleCreateAttendanceForSession}
                loading={loading}
              />
            </div>
          </Tab>
          <Tab key="statistics" title="Statistiky a analýza">
            {activeTab === 'statistics' && selectedCategory && selectedSeason && (
              <AttendanceStatisticsLazy categoryId={selectedCategory} seasonId={selectedSeason} />
            )}
            {activeTab === 'statistics' && (!selectedCategory || !selectedSeason) && (
              <Card>
                <CardBody>
                  <p className="text-center text-gray-500">
                    Please select a category and season to view statistics
                  </p>
                </CardBody>
              </Card>
            )}
          </Tab>
        </Tabs>
      </PageContainer>

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
              // previously executed fetchTrainingSessions with both category and season
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

      {/* Training Session Status Dialog */}
      <TrainingSessionStatusDialog
        isOpen={isStatusDialogOpen}
        onClose={() => {
          setIsStatusDialogOpen(false);
          setSessionForStatusUpdate(null);
        }}
        onConfirm={handleStatusUpdate}
        currentStatus={sessionForStatusUpdate?.status || 'planned'}
        sessionTitle={sessionForStatusUpdate?.title || ''}
      />
    </>
  );
}

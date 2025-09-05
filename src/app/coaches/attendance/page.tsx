"use client";

import React, { useState, useEffect } from "react";
import { useAttendance } from "@/hooks/useAttendance";
import { useSeasons } from "@/hooks/useSeasons";
import { useCategories } from "@/hooks/useCategories";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useMembers } from "@/hooks/useMembers";
import { useCategoryLineups } from "@/hooks/useCategoryLineups";
import { 
  ClipboardDocumentListIcon,
  PlusIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
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
} from "@heroui/react";
import { TrainingSessionFormData, AttendanceRecord } from "@/types/attendance";
import { formatDateString, formatTime } from "@/helpers";
import TrainingSessionModal from "./components/TrainingSessionModal";
import TrainingSessionGenerator from "./components/TrainingSessionGenerator";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

export default function CoachesAttendancePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");
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

  const { seasons, loading: seasonsLoading, fetchAllSeasons } = useSeasons();
  const {
    categories,
    loading: categoriesLoading,
    fetchCategories,
  } = useCategories();
  const { getCurrentUserCategories } = useUserRoles();
  const { members, loading: membersLoading, fetchMembers } = useMembers();
  const { 
    lineups, 
    loading: lineupsLoading, 
    fetchLineups, 
    lineupMembers,
    fetchLineupMembers 
  } = useCategoryLineups();

  // Get user's assigned categories
  const [userCategories, setUserCategories] = useState<string[]>([]);

  // Fetch initial data
  useEffect(() => {
    console.log("🔄 Fetching initial data...");
    fetchAllSeasons();
    fetchCategories();
    fetchMembers();
  }, [fetchAllSeasons, fetchCategories, fetchMembers]);

  // Fetch lineups when category and season change
  useEffect(() => {
    if (selectedCategory && selectedSeason) {
      console.log("🔄 Fetching lineups for category:", selectedCategory, "season:", selectedSeason);
      fetchLineups(selectedCategory, selectedSeason);
    }
  }, [selectedCategory, selectedSeason, fetchLineups]);

  useEffect(() => {
    const fetchUserCategories = async () => {
      try {
        console.log("🔄 Fetching user categories...");
        const categories = await getCurrentUserCategories();
        console.log("📊 User categories:", categories);
        setUserCategories(categories);
        if (categories.length > 0 && !selectedCategory) {
          console.log("🎯 Setting selected category to:", categories[0]);
          setSelectedCategory(categories[0]);
        }
      } catch (err) {
        console.error("Error fetching user categories:", err);
      }
    };

    fetchUserCategories();
  }, [getCurrentUserCategories]); // Removed selectedCategory from dependencies

  // Get active season
  const activeSeason = seasons.find((season) => season.is_active);

  useEffect(() => {
    if (activeSeason && !selectedSeason) {
      setSelectedSeason(activeSeason.id);
    }
  }, [activeSeason, selectedSeason]);

  // Fetch data when category and season change
  useEffect(() => {
    if (selectedCategory && selectedSeason) {
      console.log(
        "🔄 Fetching data for category:",
        selectedCategory,
        "season:",
        selectedSeason
      );
      // Convert category ID to category code
      const selectedCategoryData = categories.find(
        (c) => c.id === selectedCategory
      );
      const categoryCode = selectedCategoryData?.code || selectedCategory;
      console.log("📊 Using category code:", categoryCode);
      
      fetchTrainingSessions(categoryCode, selectedSeason);
      fetchAttendanceSummary(categoryCode, selectedSeason);
    }
  }, [
    selectedCategory,
    selectedSeason,
    categories,
    fetchTrainingSessions,
    fetchAttendanceSummary,
  ]);

  // Fetch attendance records when session changes
  useEffect(() => {
    if (selectedSession) {
      console.log("🔄 Fetching attendance records for session:", selectedSession);
      fetchAttendanceRecords(selectedSession);
    }
  }, [selectedSession, fetchAttendanceRecords]);

  // Get lineup members for the selected category, fallback to filtered members if no lineups
  const lineupMembersList = lineupMembers.map(lineupMember => lineupMember.member).filter(Boolean);
  
  // Fallback: if no lineup members, filter all members by category
  const fallbackMembers = members.filter((member) => {
    const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
    const selectedCategoryCode = selectedCategoryData?.code;
    return member.category === selectedCategoryCode;
  });

  // Use lineup members if available, otherwise use filtered members
  const unsortedMembers = lineupMembersList.length > 0 ? lineupMembersList : fallbackMembers;

  // Sort members by surname, then by name
  const filteredMembers = unsortedMembers.sort((a, b) => {
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

  // Debug logging (only when values change significantly)
  useEffect(() => {
    console.log('🔍 Members debug:', {
      selectedCategory,
      totalMembers: members.length,
      lineupMembersCount: lineupMembers.length,
      lineupMembersListCount: lineupMembersList.length,
      fallbackMembersCount: fallbackMembers.length,
      finalFilteredMembersCount: filteredMembers.length,
      usingLineupMembers: lineupMembersList.length > 0,
      lineupMembers: lineupMembers.map(lm => ({ 
        id: lm.member?.id, 
        name: lm.member?.name, 
        surname: lm.member?.surname,
        position: lm.position 
      }))
    });
  }, [selectedCategory, members.length, lineupMembers.length, lineupMembersList.length, fallbackMembers.length, filteredMembers.length]);

  const handleSessionSubmit = async (sessionData: TrainingSessionFormData) => {
    try {
      // Convert category ID to category code
      const selectedCategoryData = categories.find(
        (c) => c.id === selectedCategory
      );
      const categoryCode = selectedCategoryData?.code || selectedCategory;
      
      const dataWithCategory = {
        ...sessionData,
        category: categoryCode,
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
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();
            
            // First get the lineup for this category and season
            const { data: lineupData, error: lineupError } = await supabase
              .from('category_lineups')
              .select('id')
              .eq('category_id', selectedCategory)
              .eq('season_id', selectedSeason)
              .eq('is_active', true)
              .single();

            if (!lineupError && lineupData) {
              // Then get the lineup members
              const { data: membersData, error: membersError } = await supabase
                .from('category_lineup_members')
                .select(`
                  member_id,
                  members!inner (
                    id,
                    name,
                    surname,
                    category
                  )
                `)
                .eq('lineup_id', lineupData.id)
                .eq('is_active', true);

              if (!membersError && membersData) {
                memberIds = membersData.map((item: any) => item.member?.id).filter(Boolean) || [];
              }
            }
          } catch (err) {
            console.log('Could not fetch lineup members, will use fallback');
          }

          console.log('🔍 Creating attendance for new session:', createdSession.id, 'with lineup members:', memberIds);

          if (memberIds.length === 0) {
            // Fallback to filtered members if no lineup members
            const fallbackMembers = members.filter((member) => member.category === categoryCode);
            const fallbackMemberIds = fallbackMembers.map(m => m.id);
            
            console.log('🔍 Using fallback members for new session:', fallbackMemberIds);
            
            if (fallbackMemberIds.length > 0) {
              await createAttendanceForLineupMembers(createdSession.id, fallbackMemberIds, 'present');
              console.log(`✅ Created ${fallbackMemberIds.length} attendance records for new session (fallback)`);
            }
          } else {
            await createAttendanceForLineupMembers(createdSession.id, memberIds, 'present');
            console.log(`✅ Created ${memberIds.length} attendance records for new session`);
          }
        } catch (attendanceErr) {
          console.warn('Could not create attendance records for new session:', attendanceErr);
          // Don't fail the session creation if attendance fails
        }
      }

      setIsSessionModalOpen(false);
    } catch (err) {
      console.error("Error saving session:", err);
      console.error("Error details:", {
        message: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : "Unknown",
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
        setSelectedSession("");
      }
      setIsDeleteModalOpen(false);
      setSessionToDelete(null);
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  const handleRecordAttendance = async (
    memberId: string,
    status: "present" | "absent" | "late" | "excused"
  ) => {
    if (!selectedSession) return;

    try {
      await recordAttendance(memberId, selectedSession, status);
    } catch (err) {
      console.error("Error recording attendance:", err);
      // Show error to user - you might want to add a toast notification here
      alert(err instanceof Error ? err.message : "Chyba při zaznamenávání docházky");
    }
  };

  const handleCreateAttendanceForSession = async () => {
    if (!selectedSession || !selectedCategory || !selectedSeason) return;

    try {
      // Get lineup members for the selected category and season
      await fetchLineups(selectedCategory, selectedSeason);
      const memberIds = lineupMembers
        .map(lm => lm.member?.id)
        .filter(Boolean) as string[];

      console.log('Lineup members found:', lineupMembers.length, 'Member IDs:', memberIds);

      if (memberIds.length === 0) {
        // Fallback to filtered members if no lineup members
        const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
        const selectedCategoryCode = selectedCategoryData?.code;
        const fallbackMembers = members.filter((member) => member.category === selectedCategoryCode);
        const fallbackMemberIds = fallbackMembers.map(m => m.id);
        
        console.log('Using fallback members:', fallbackMembers.length, 'Fallback member IDs:', fallbackMemberIds);
        
        if (fallbackMemberIds.length === 0) {
          alert("Žádní členové nejsou k dispozici pro vybranou kategorii");
          return;
        }
        
        await createAttendanceForLineupMembers(selectedSession, fallbackMemberIds, 'present');
        await fetchAttendanceRecords(selectedSession);
        alert(`Vytvořeno ${fallbackMemberIds.length} záznamů docházky pro tento trénink (použiti všichni členové kategorie)`);
        return;
      }

      console.log('Creating attendance records for existing session:', selectedSession, 'with members:', memberIds);
      
      await createAttendanceForLineupMembers(selectedSession, memberIds, 'present');
      
      // Refresh attendance records
      await fetchAttendanceRecords(selectedSession);
      
      alert(`Vytvořeno ${memberIds.length} záznamů docházky pro tento trénink`);
    } catch (err) {
      console.error("Error creating attendance records:", err);
      alert(err instanceof Error ? err.message : "Chyba při vytváření záznamů docházky");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "success";
      case "absent":
        return "danger";
      case "late":
        return "warning";
      case "excused":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "present":
        return "Přítomen";
      case "absent":
        return "Nepřítomen";
      case "late":
        return "Pozdní příchod";
      case "excused":
        return "Omluven";
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardDocumentListIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Docházka členů</h1>
        </div>
        <p className="text-gray-600">
          Sledování docházky členů na tréninkové jednotky
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex gap-4 justify-between">
            <div className="flex items-end gap-2 w-[400px]">
            <Select
              label="Kategorie"
              placeholder="Vyberte kategorii"
              selectedKeys={selectedCategory ? [selectedCategory] : []}
                onSelectionChange={(keys) =>
                  setSelectedCategory(Array.from(keys)[0] as string)
                }
                isDisabled={categoriesLoading || categories.length === 1}
            >
              {userCategories.map((categoryId) => {
                  const category = categories.find((c) => c.id === categoryId);
                return (
                    <SelectItem key={categoryId}>
                    {category?.name || categoryId}
                  </SelectItem>
                );
              })}
            </Select>

            <Select
              label="Sezóna"
              placeholder="Vyberte sezónu"
              selectedKeys={selectedSeason ? [selectedSeason] : []}
                onSelectionChange={(keys) =>
                  setSelectedSeason(Array.from(keys)[0] as string)
                }
              isDisabled={seasonsLoading}
            >
              {seasons.map((season) => (
                  <SelectItem key={season.id}>{season.name}</SelectItem>
              ))}
            </Select>
            </div>

            <div className="flex items-end gap-2">
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
              >
                Nový trénink
              </Button>
              <Button
                color="primary"
                variant="bordered"
                startContent={<CalendarIcon className="w-4 h-4" />}
                onPress={() => setIsGeneratorOpen(true)}
                isDisabled={!selectedCategory || !selectedSeason}
                isIconOnly
                aria-label="Generovat tréninky"
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
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedSession(session.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {session.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <div>{formatDateString(session.session_date)}</div>
                            {session.session_time && (
                              <div>{formatTime(session.session_time)}</div>
                            )}
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
                <h3 className="text-lg font-semibold">Docházka</h3>
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
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">
                    Žádné záznamy docházky pro tento trénink
                  </p>
                  <p className="text-sm text-gray-400">
                    Debug: selectedSession = {selectedSession}, attendanceRecords.length = {attendanceRecords.length}
                  </p>
                </div>
              ) : (
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
                        const surnameComparison = (a.member.surname || '').localeCompare(b.member.surname || '');
                        if (surnameComparison !== 0) {
                          return surnameComparison;
                        }
                        return (a.member.name || '').localeCompare(b.member.name || '');
                      })
                      .map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {record.member.name} {record.member.surname}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {(
                              ["present", "absent", "late", "excused"] as const
                            ).map((status) => (
                              <Button
                                key={status}
                                size="sm"
                                variant={
                                  record.attendance_status === status
                                    ? "solid"
                                    : "light"
                                }
                                color={getStatusColor(status)}
                                onPress={() =>
                                  handleRecordAttendance(
                                    record.member.id,
                                    status
                                  )
                                }
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
      <TrainingSessionModal
        isOpen={isSessionModalOpen}
        onClose={() => {
          setEditingSession(null);
          setIsSessionModalOpen(false);
        }}
        onSubmit={handleSessionSubmit}
        session={editingSession}
        selectedCategory={selectedCategory}
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
            const categoryCode = categories.find(
              (c) => c.id === selectedCategory
            )?.code;
            if (categoryCode) {
              fetchTrainingSessions(categoryCode, selectedSeason);
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
    </div>
  );
}

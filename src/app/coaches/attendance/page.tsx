"use client";

import React, { useState, useEffect } from "react";
import { useAttendance } from "@/hooks/useAttendance";
import { useSeasons } from "@/hooks/useSeasons";
import { useCategories } from "@/hooks/useCategories";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useMembers } from "@/hooks/useMembers";
import { 
  ClipboardDocumentListIcon,
  PlusIcon,
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  MapPinIcon,
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
  Chip,
  Badge,
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
import AttendanceModal from "./components/AttendanceModal";
import TrainingSessionModal from "./components/TrainingSessionModal";
import TrainingSessionGenerator from "./components/TrainingSessionGenerator";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

export default function CoachesAttendancePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
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
  } = useAttendance();

  const { seasons, loading: seasonsLoading, fetchAllSeasons } = useSeasons();
  const {
    categories,
    loading: categoriesLoading,
    fetchCategories,
  } = useCategories();
  const { getCurrentUserCategories } = useUserRoles();
  const { members, loading: membersLoading, fetchMembers } = useMembers();

  // Get user's assigned categories
  const [userCategories, setUserCategories] = useState<string[]>([]);

  // Fetch initial data
  useEffect(() => {
    console.log("🔄 Fetching initial data...");
    fetchAllSeasons();
    fetchCategories();
    fetchMembers();
  }, []); // Empty dependency array - only run once on mount

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
      fetchAttendanceRecords(selectedSession);
    }
  }, [selectedSession, fetchAttendanceRecords]);

  // Filter members by selected category
  const filteredMembers = members.filter((member) => {
    // Find the category for this member and check if it matches selected category
    const memberCategory = categories.find((c) => c.id === member.category);
    return memberCategory && memberCategory.id === selectedCategory;
  });

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
        await createTrainingSession(dataWithCategory);
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
                  setIsSessionModalOpen(true);
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
        onClose={() => setIsSessionModalOpen(false)}
        onSubmit={handleSessionSubmit}
        session={editingSession}
        selectedCategory={selectedCategory}
        selectedSeason={selectedSeason}
      />

      {/* Attendance Modal */}
      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        membersLoading={membersLoading}
        filteredMembers={filteredMembers}
        attendanceRecords={attendanceRecords}
        onRecordAttendance={handleRecordAttendance}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
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

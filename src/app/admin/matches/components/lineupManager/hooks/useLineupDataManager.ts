import {useState, useCallback, useMemo} from 'react';
import {useLineupData, useLineupManager, useTeamClubId} from '@/hooks';
import {LineupFormData, LineupPlayerFormData, LineupCoachFormData, LineupSummary} from '@/types';
import {TeamTypes, LineupCoachRole, MemberFunction, PlayerPosition} from '@/enums';
import {showToast} from '@/components';
import {LineupErrorType} from '@/enums';
import {classifyLineupError} from '@/helpers';

interface UseLineupDataManagerProps {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  members: any[];
  categoryId?: string;
  onClose?: () => void;
  onMemberCreated?: () => void;
}

interface UseLineupDataManagerReturn {
  // Form data
  homeFormData: LineupFormData;
  awayFormData: LineupFormData;
  selectedTeam: TeamTypes;
  setSelectedTeam: (team: TeamTypes) => void;

  // Current team data
  currentTeamId: string;
  currentTeamName: string;
  currentFormData: LineupFormData;
  setCurrentFormData: (updater: (prev: LineupFormData) => LineupFormData) => void;

  // Club information
  currentTeamClubId: string | null;
  clubIdLoading: boolean;
  clubIdError: string | null;

  // Filtered members
  filteredMembers: any[];
  availableCoaches: any[];

  // Validation
  validationError: string | null;
  setValidationError: (error: string | null) => void;

  // CRUD operations
  handleLoadLineup: (isHome: boolean) => Promise<void>;
  handleSaveLineup: (isHome: boolean) => Promise<void>;
  handleDeleteLineup: () => Promise<void>;

  // Player operations
  handleAddPlayer: () => void;
  handlePlayerSelected: (player: LineupPlayerFormData) => Promise<void>;
  handleEditPlayer: (index: number) => void;
  handlePlayerEditSave: (updatedPlayer: LineupPlayerFormData) => void;
  handleDeletePlayer: (index: number) => void;
  confirmDeletePlayer: () => void;

  // Coach operations
  handleAddCoach: () => void;
  handleCoachSelected: (coach: {member_id: string; role: string}) => void;
  handleEditCoach: (index: number) => void;
  handleCoachEditSave: (updatedCoach: LineupCoachFormData) => void;
  handleDeleteCoach: (index: number) => void;

  // Utility functions
  getMemberName: (memberId: string) => string;
  calculateLocalSummary: (formData: LineupFormData) => LineupSummary;

  // Modal states
  editingPlayerIndex: number | null;
  setEditingPlayerIndex: (index: number | null) => void;
  deletingPlayerIndex: number | null;
  setDeletingPlayerIndex: (index: number | null) => void;
  editingCoachIndex: number | null;
  setEditingCoachIndex: (index: number | null) => void;

  // Loading and error states
  loading: boolean;
  error: string | null;
}

export function useLineupDataManager({
  matchId,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  members,
  categoryId,
  onClose,
  onMemberCreated,
}: UseLineupDataManagerProps): UseLineupDataManagerReturn {
  // State management
  const [selectedTeam, setSelectedTeam] = useState<TeamTypes>(TeamTypes.HOME);
  const [homeFormData, setHomeFormData] = useState<LineupFormData>({
    match_id: matchId,
    team_id: homeTeamId,
    is_home_team: true,
    players: [],
    coaches: [],
  });
  const [awayFormData, setAwayFormData] = useState<LineupFormData>({
    match_id: matchId,
    team_id: awayTeamId,
    is_home_team: false,
    players: [],
    coaches: [],
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const [deletingPlayerIndex, setDeletingPlayerIndex] = useState<number | null>(null);
  const [editingCoachIndex, setEditingCoachIndex] = useState<number | null>(null);

  // Hooks
  const {getOrCreateLineupId, findLineupId} = useLineupManager();
  const {fetchLineup, saveLineup, deleteLineup, validateLineupData, loading, error} =
    useLineupData();

  // Get the current team ID based on selected team
  const currentTeamId = useMemo(() => {
    return selectedTeam === TeamTypes.HOME ? homeTeamId : awayTeamId;
  }, [selectedTeam, homeTeamId, awayTeamId]);

  // Get club ID for the current team
  const {
    clubId: currentTeamClubId,
    loading: clubIdLoading,
    error: clubIdError,
  } = useTeamClubId(currentTeamId);

  // Get the current form data based on selected team
  const currentFormData = useMemo(() => {
    return selectedTeam === TeamTypes.HOME ? homeFormData : awayFormData;
  }, [selectedTeam, homeFormData, awayFormData]);

  // Get the setter function for current form data
  const setCurrentFormData = useCallback(
    (updater: (prev: LineupFormData) => LineupFormData) => {
      if (selectedTeam === TeamTypes.HOME) {
        setHomeFormData(updater);
      } else {
        setAwayFormData(updater);
      }
    },
    [selectedTeam]
  );

  // Filter members by category
  const filteredMembers = useMemo(() => {
    if (!categoryId) {
      return members;
    }

    // Try filtering by category_id first (new approach)
    let filtered = members.filter((member) => member.category_id === categoryId);

    // If no members found with category_id, fallback to legacy category code filtering
    if (filtered.length === 0 && categoryId) {
      filtered = members.filter((member) => member.category_id === categoryId);
    }

    // If still no members found, show all members as fallback
    if (filtered.length === 0) {
      return members;
    }

    return filtered;
  }, [members, categoryId]);

  // Get available coaches
  const availableCoaches = useMemo(() => {
    let coaches = filteredMembers.filter((m) => m.functions?.includes(MemberFunction.COACH));

    // If we have club information, filter by the current team's club
    if (currentTeamClubId) {
      coaches = coaches.filter(
        (m) => m.core_club_id === currentTeamClubId || m.current_club_id === currentTeamClubId
      );
    }

    return coaches;
  }, [filteredMembers, currentTeamClubId]);

  const currentTeamName = selectedTeam === TeamTypes.HOME ? homeTeamName : awayTeamName;

  // Load lineup data when team changes
  const handleLoadLineup = useCallback(
    async (isHome: boolean) => {
      try {
        const currentTeamId = isHome ? homeTeamId : awayTeamId;
        const lineupData = await fetchLineup(matchId, currentTeamId);

        const updatedFormData = {
          match_id: matchId,
          team_id: currentTeamId,
          is_home_team: isHome,
          players: lineupData.players || [],
          coaches: lineupData.coaches || [],
        };

        if (isHome) {
          setHomeFormData(updatedFormData);
        } else {
          setAwayFormData(updatedFormData);
        }
      } catch (error) {
        console.error('Error loading lineup:', error);
        // Set empty form data if no lineup exists
        const emptyFormData = {
          match_id: matchId,
          team_id: isHome ? homeTeamId : awayTeamId,
          is_home_team: isHome,
          players: [],
          coaches: [],
        };

        if (isHome) {
          setHomeFormData(emptyFormData);
        } else {
          setAwayFormData(emptyFormData);
        }
      }
    },
    [matchId, homeTeamId, awayTeamId, fetchLineup]
  );

  const handleSaveLineup = useCallback(
    async (isHome: boolean) => {
      try {
        const currentTeamId = isHome ? homeTeamId : awayTeamId;

        // Get current form data for debugging
        const formDataToSave = isHome ? homeFormData : awayFormData;

        // Get or create lineup ID using the hook
        const lineupId = await getOrCreateLineupId(matchId, currentTeamId, isHome);

        await saveLineup(lineupId, {
          ...formDataToSave,
          match_id: matchId,
          team_id: currentTeamId,
          is_home_team: isHome,
        });

        // Show success message
        showToast.success('Sestava byla úspěšně uložena!');

        // Close the dialog only on successful save
        if (onClose) {
          onClose();
        }
      } catch (error: unknown) {
        console.error('Error saving lineup:', error);

        // Use robust error classification
        const classifiedError = classifyLineupError(error);

        // Handle validation errors (keep modal open)
        if (classifiedError.type === LineupErrorType.VALIDATION_ERROR) {
          setValidationError(classifiedError.message);
          showToast.warning(
            `⚠️ Pravidla sestavy:\n\n${classifiedError.message}\n\nOpravte chyby a zkuste to znovu.`
          );
          return; // Don't close the modal
        }

        // Handle database errors
        if (classifiedError.type === LineupErrorType.DATABASE_ERROR) {
          showToast.danger(
            `❌ Chyba databáze:\n\n${classifiedError.message}\n\nKontaktujte podporu.`
          );
          return;
        }

        // Handle network errors
        if (classifiedError.type === LineupErrorType.NETWORK_ERROR) {
          showToast.danger(
            `❌ Problém se sítí:\n\n${classifiedError.message}\n\nZkontrolujte připojení a zkuste to znovu.`
          );
          return;
        }

        // Handle unknown errors
        showToast.danger(`❌ Neznámá chyba:\n\n${classifiedError.message}\n\nKontaktujte podporu.`);
      }
    },
    [
      matchId,
      homeTeamId,
      awayTeamId,
      homeFormData,
      awayFormData,
      getOrCreateLineupId,
      saveLineup,
      onClose,
    ]
  );

  const handleDeleteLineup = useCallback(async () => {
    try {
      const currentTeamId = selectedTeam === TeamTypes.HOME ? homeTeamId : awayTeamId;

      // Find the lineup ID using the hook
      const lineupId = await findLineupId(matchId, currentTeamId);

      if (!lineupId) {
        // If no lineup exists, just reset the form data and show success message
        const emptyFormData = {
          match_id: matchId,
          team_id: currentTeamId,
          is_home_team: selectedTeam === TeamTypes.HOME,
          players: [],
          coaches: [],
        };

        if (selectedTeam === TeamTypes.HOME) {
          setHomeFormData(emptyFormData);
        } else {
          setAwayFormData(emptyFormData);
        }

        alert('Sestava byla vymazána (neexistovala v databázi)');
        return;
      }

      await deleteLineup(lineupId);

      // Reset form data
      const emptyFormData = {
        match_id: matchId,
        team_id: currentTeamId,
        is_home_team: selectedTeam === TeamTypes.HOME,
        players: [],
        coaches: [],
      };

      if (selectedTeam === TeamTypes.HOME) {
        setHomeFormData(emptyFormData);
      } else {
        setAwayFormData(emptyFormData);
      }
    } catch (error: unknown) {
      console.error('Error deleting lineup:', error);
      const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';
      alert(`Chyba při mazání sestavy: ${errorMessage}`);
    }
  }, [matchId, homeTeamId, awayTeamId, selectedTeam, findLineupId, deleteLineup]);

  // Player operations
  const handleAddPlayer = useCallback(() => {
    // Clear validation error when user adds players
    if (validationError) {
      setValidationError(null);
    }
  }, [validationError]);

  const handlePlayerSelected = useCallback(
    async (player: LineupPlayerFormData) => {
      if (editingPlayerIndex !== null) {
        // Editing existing player
        setCurrentFormData((prev) => ({
          ...prev,
          players: prev.players.map((p, i) => (i === editingPlayerIndex ? player : p)),
        }));
        setEditingPlayerIndex(null);
      } else {
        // Adding new player
        const updatedFormData = {
          ...currentFormData,
          players: [...currentFormData.players, player],
        };

        setCurrentFormData((prev) => updatedFormData);

        // If this is the first player, create lineup automatically
        if (currentFormData.players.length === 0) {
          try {
            const isHome = selectedTeam === TeamTypes.HOME;
            const currentTeamId = isHome ? homeTeamId : awayTeamId;

            const lineupId = await getOrCreateLineupId(matchId, currentTeamId, isHome);
            await saveLineup(
              lineupId,
              {
                ...updatedFormData,
                match_id: matchId,
                team_id: currentTeamId,
                is_home_team: isHome,
              },
              true
            ); // Skip validation for automatic lineup creation

            showToast.success('Sestava byla automaticky vytvořena');

            // Show validation warnings for incomplete lineup
            const validation = validateLineupData(updatedFormData);
            if (validation.warnings.length > 0) {
              showToast.warning(`Upozornění: ${validation.warnings.join(', ')}`);
            }

            // Show specific warning about goalkeeper requirement
            const goalkeepers = updatedFormData.players.filter((p) => p.position === 'goalkeeper');
            if (goalkeepers.length === 0) {
              showToast.warning('Upozornění: Sestava musí mít alespoň 1 brankáře');
            }
          } catch (error) {
            console.error('Error creating lineup automatically:', error);

            // Check if it's a validation warning that we should show as a warning instead of error
            if (error instanceof Error && error.message.includes('VALIDATION_WARNING')) {
              const warningMessage = error.message.replace('VALIDATION_WARNING: ', '');
              showToast.warning(`Upozornění: ${warningMessage}`);
              // Still show success for lineup creation, just with warning
              showToast.success('Sestava byla vytvořena s upozorněním');
            } else {
              showToast.danger(
                `Chyba při vytváření sestavy: ${error instanceof Error ? error.message : 'Neznámá chyba'}`
              );
            }
          }
        } else {
          // Player added to existing lineup
          showToast.success('Hráč byl přidán do sestavy');

          // Show validation warnings for incomplete lineup
          const validation = validateLineupData(updatedFormData);
          if (validation.warnings.length > 0) {
            showToast.warning(`Upozornění: ${validation.warnings.join(', ')}`);
          }
        }
      }
    },
    [
      editingPlayerIndex,
      currentFormData,
      selectedTeam,
      homeTeamId,
      awayTeamId,
      matchId,
      getOrCreateLineupId,
      saveLineup,
      validateLineupData,
      setCurrentFormData,
    ]
  );

  const handleEditPlayer = useCallback((index: number) => {
    setEditingPlayerIndex(index);
  }, []);

  const handlePlayerEditSave = useCallback(
    (updatedPlayer: LineupPlayerFormData) => {
      if (editingPlayerIndex !== null) {
        setCurrentFormData((prev) => ({
          ...prev,
          players: prev.players.map((p, i) => (i === editingPlayerIndex ? updatedPlayer : p)),
        }));
        setEditingPlayerIndex(null);
      }
    },
    [editingPlayerIndex, setCurrentFormData]
  );

  const handleDeletePlayer = useCallback((index: number) => {
    setDeletingPlayerIndex(index);
  }, []);

  const confirmDeletePlayer = useCallback(() => {
    if (deletingPlayerIndex !== null) {
      // Clear validation error when user removes players
      if (validationError) {
        setValidationError(null);
      }

      setCurrentFormData((prev) => ({
        ...prev,
        players: prev.players.filter((_, i) => i !== deletingPlayerIndex),
      }));

      setDeletingPlayerIndex(null);
    }
  }, [deletingPlayerIndex, validationError, setCurrentFormData]);

  // Coach operations
  const handleAddCoach = useCallback(() => {
    // Implementation for adding coach
  }, []);

  const handleCoachSelected = useCallback(
    (coach: {member_id: string; role: string}) => {
      const coachData: LineupCoachFormData = {
        member_id: coach.member_id,
        role: coach.role as LineupCoachRole,
      };

      if (editingCoachIndex !== null) {
        // Editing existing coach
        setCurrentFormData((prev) => ({
          ...prev,
          coaches: prev.coaches.map((c, i) => (i === editingCoachIndex ? coachData : c)),
        }));
        setEditingCoachIndex(null);
      } else {
        // Adding new coach
        setCurrentFormData((prev) => {
          const newFormData = {
            ...prev,
            coaches: [...prev.coaches, coachData],
          };
          return newFormData;
        });
      }
    },
    [editingCoachIndex, setCurrentFormData]
  );

  const handleEditCoach = useCallback((index: number) => {
    setEditingCoachIndex(index);
  }, []);

  const handleCoachEditSave = useCallback(
    (updatedCoach: LineupCoachFormData) => {
      if (editingCoachIndex !== null) {
        setCurrentFormData((prev) => ({
          ...prev,
          coaches: prev.coaches.map((c, i) => (i === editingCoachIndex ? updatedCoach : c)),
        }));
        setEditingCoachIndex(null);
      }
    },
    [editingCoachIndex, setCurrentFormData]
  );

  const handleDeleteCoach = useCallback(
    (index: number) => {
      setCurrentFormData((prev) => ({
        ...prev,
        coaches: prev.coaches.filter((_, i) => i !== index),
      }));
    },
    [setCurrentFormData]
  );

  // Utility functions
  const getMemberName = useCallback(
    (memberId: string) => {
      const member = filteredMembers.find((m) => m.id === memberId);
      return member ? `${member.surname} ${member.name}` : 'Neznámý člen';
    },
    [filteredMembers]
  );

  const calculateLocalSummary = useCallback((formData: LineupFormData): LineupSummary => {
    const goalkeepers = formData.players.filter(
      (p) => p.position === PlayerPosition.GOALKEEPER
    ).length;
    const fieldPlayers = formData.players.filter(
      (p) => p.position === PlayerPosition.FIELD_PLAYER
    ).length;
    const coaches = formData.coaches.length;
    const totalPlayers = goalkeepers + fieldPlayers;

    return {
      total_players: totalPlayers,
      goalkeepers,
      field_players: fieldPlayers,
      coaches,
      is_valid:
        goalkeepers >= 1 &&
        goalkeepers <= 2 &&
        fieldPlayers >= 6 &&
        fieldPlayers <= 13 &&
        coaches <= 3,
    };
  }, []);

  return {
    // Form data
    homeFormData,
    awayFormData,
    selectedTeam,
    setSelectedTeam,

    // Current team data
    currentTeamId,
    currentTeamName,
    currentFormData,
    setCurrentFormData,

    // Club information
    currentTeamClubId,
    clubIdLoading,
    clubIdError,

    // Filtered members
    filteredMembers,
    availableCoaches,

    // Validation
    validationError,
    setValidationError,

    // CRUD operations
    handleLoadLineup,
    handleSaveLineup,
    handleDeleteLineup,

    // Player operations
    handleAddPlayer,
    handlePlayerSelected,
    handleEditPlayer,
    handlePlayerEditSave,
    handleDeletePlayer,
    confirmDeletePlayer,

    // Coach operations
    handleAddCoach,
    handleCoachSelected,
    handleEditCoach,
    handleCoachEditSave,
    handleDeleteCoach,

    // Utility functions
    getMemberName,
    calculateLocalSummary,

    // Modal states
    editingPlayerIndex,
    setEditingPlayerIndex,
    deletingPlayerIndex,
    setDeletingPlayerIndex,
    editingCoachIndex,
    setEditingCoachIndex,

    // Loading and error states
    loading,
    error,
  };
}

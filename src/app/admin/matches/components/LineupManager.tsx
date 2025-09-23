'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  useDisclosure,
  Table,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  TableHeader,
  Tabs,
  Tab,
  ButtonGroup,
} from '@heroui/react';
import {
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {useLineupData, classifyLineupError, LineupErrorType} from '@/hooks/useLineupData';
import {
  LineupFormData,
  LineupPlayerFormData,
  LineupCoachFormData,
  Member,
  ExternalPlayer,
} from '@/types';
import {createClient} from '@/utils/supabase/client';
import {DeleteConfirmationModal, showToast, LoadingSpinner} from '@/components';
import LineupPlayerSelectionModal from './LineupPlayerSelectionModal';
import LineupPlayerEditModal from './LineupPlayerEditModal';
import LineupCoachSelectionModal from './LineupCoachSelectionModal';
import LineupCoachEditModal from './LineupCoachEditModal';
import {generateLineupId} from '@/utils/uuid';
import {Heading} from '@/components';
import {LineupCoachRoles, LINEUP_COACH_ROLES_OPTIONS} from '@/constants';

interface LineupManagerProps {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  members: Member[];
  categoryId: string;
  onClose?: () => void;
}

export interface LineupManagerRef {
  saveLineup: () => Promise<void>;
}

const LineupManager = forwardRef<LineupManagerRef, LineupManagerProps>(
  (
    {matchId, homeTeamId, awayTeamId, homeTeamName, awayTeamName, members, categoryId, onClose},
    ref
  ) => {
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

    const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
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

    // Determine if the selected team is the user's own club
    const isOwnClub = useMemo(() => {
      // CONFIGURATION: Change this to determine which team is your own club
      // Options:
      // 1. Home team is always your club: return selectedTeam === 'home';
      // 2. Away team is always your club: return selectedTeam === 'away';
      // 3. Specific team ID: return selectedTeam === 'home' ? homeTeamId === 'YOUR_CLUB_ID' : awayTeamId === 'YOUR_CLUB_ID';
      // 4. Based on team name: return selectedTeam === 'home' ? homeTeamName.includes('Your Club') : awayTeamName.includes('Your Club');

      // FIXED: Home team is your club (internal players), Away team is other club (external players)
      return selectedTeam === 'home';

      // Alternative configurations (uncomment one):
      // return selectedTeam === 'away'; // Away team is your club
      // return homeTeamName.includes('Baník Most') || awayTeamName.includes('Baník Most'); // Based on team name
    }, [selectedTeam]);

    // Debug: Log the own club determination

    // Get the current form data based on selected team
    const currentFormData = useMemo(() => {
      return selectedTeam === 'home' ? homeFormData : awayFormData;
    }, [selectedTeam, homeFormData, awayFormData]);

    // Get the setter function for current form data
    const setCurrentFormData = useCallback(
      (updater: (prev: LineupFormData) => LineupFormData) => {
        if (selectedTeam === 'home') {
          setHomeFormData(updater);
        } else {
          setAwayFormData(updater);
        }
      },
      [selectedTeam]
    );
    const [homeLineupSummary, setHomeLineupSummary] = useState<any | null>(null);
    const [awayLineupSummary, setAwayLineupSummary] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<ExternalPlayer[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
    const [deletingPlayerIndex, setDeletingPlayerIndex] = useState<number | null>(null);
    const [isPlayerEditModalOpen, setIsPlayerEditModalOpen] = useState(false);
    const [isCoachSelectionModalOpen, setIsCoachSelectionModalOpen] = useState(false);
    const [isCoachEditModalOpen, setIsCoachEditModalOpen] = useState(false);
    const [editingCoachIndex, setEditingCoachIndex] = useState<number | null>(null);
    const [deletingCoachIndex, setDeletingCoachIndex] = useState<number | null>(null);

    const supabase = createClient();

    const {
      isOpen: isEditModalOpen,
      onOpen: onEditModalOpen,
      onClose: onEditModalClose,
    } = useDisclosure();

    const {
      isOpen: isPlayerSelectionModalOpen,
      onOpen: onPlayerSelectionModalOpen,
      onClose: onPlayerSelectionModalClose,
    } = useDisclosure();

    const handleEditModalOpen = () => {
      setValidationError(null); // Clear any previous validation errors
      onEditModalOpen();
    };

    const {
      isOpen: isDeleteModalOpen,
      onOpen: onDeleteModalOpen,
      onClose: onDeleteModalClose,
    } = useDisclosure();

    const {
      isOpen: isDeletePlayerModalOpen,
      onOpen: onDeletePlayerModalOpen,
      onClose: onDeletePlayerModalClose,
    } = useDisclosure();

    const {
      fetchLineup,
      saveLineup,
      deleteLineup,
      getLineupSummary,
      searchExternalPlayers,
      validateLineupData,
      loading,
      error,
    } = useLineupData();

    const currentTeamId = selectedTeam === 'home' ? homeTeamId : awayTeamId;
    const currentTeamName = selectedTeam === 'home' ? homeTeamName : awayTeamName;

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

    // Load lineup summaries
    const loadLineupSummaries = useCallback(async () => {
      try {
        const homeSummary = await getLineupSummary(matchId, homeTeamId);
        const awaySummary = await getLineupSummary(matchId, awayTeamId);

        setHomeLineupSummary(homeSummary);
        setAwayLineupSummary(awaySummary);
      } catch (error) {
        console.error('Error loading lineup summaries:', error);
      }
    }, [matchId, homeTeamId, awayTeamId, getLineupSummary]);

    // Load lineup data when component mounts or team changes
    useEffect(() => {
      let isMounted = true;

      const loadData = async () => {
        if (isMounted) {
          await handleLoadLineup(selectedTeam === 'home');
        }
      };

      loadData();

      return () => {
        isMounted = false;
      };
    }, [selectedTeam, handleLoadLineup]);

    // Load lineup summaries when component mounts
    useEffect(() => {
      let isMounted = true;

      const loadSummaries = async () => {
        if (isMounted) {
          await loadLineupSummaries();
        }
      };

      loadSummaries();

      return () => {
        isMounted = false;
      };
    }, [loadLineupSummaries]);

    // Search external players
    const handleSearchExternalPlayers = useCallback(
      async (term: string) => {
        if (term.length < 2) {
          setSearchResults([]);
          return;
        }

        setIsSearching(true);
        const results = await searchExternalPlayers(term);
        setSearchResults(results);
        setIsSearching(false);
      },
      [searchExternalPlayers]
    );

    // Debounced search
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        handleSearchExternalPlayers(searchTerm);
      }, 300);

      return () => clearTimeout(timeoutId);
    }, [searchTerm, handleSearchExternalPlayers]);

    // Auto-fill external player data when registration number is entered
    const handleExternalRegistrationNumberChange = useCallback(
      (index: number, value: string) => {
        const player = currentFormData.players[index];
        if (!player) return;

        // Search for existing player with this registration number
        const existingPlayer = searchResults.find((p) => p.registration_number === value);

        if (existingPlayer) {
          // Auto-fill the player data
          const updatedPlayers = [...currentFormData.players];
          updatedPlayers[index] = {
            ...player,
            external_name: existingPlayer.name,
            external_surname: existingPlayer.surname,
            external_registration_number: existingPlayer.registration_number,
            display_name: `${existingPlayer.name} ${existingPlayer.surname} (${existingPlayer.registration_number})`,
          };
          setCurrentFormData((prev) => ({...prev, players: updatedPlayers}));
        } else {
          // Just update the registration number
          const updatedPlayers = [...currentFormData.players];
          updatedPlayers[index] = {
            ...player,
            external_registration_number: value,
          };
          setCurrentFormData((prev) => ({...prev, players: updatedPlayers}));
        }
      },
      [currentFormData, searchResults, setCurrentFormData]
    );

    const handleSaveLineup = async (isHome: boolean) => {
      try {
        const currentTeamId = isHome ? homeTeamId : awayTeamId;

        // Get current form data for debugging
        const formDataToSave = isHome ? homeFormData : awayFormData;

        // First, check if lineup already exists and get its ID
        const {data: existingLineup, error: fetchError} = await supabase
          .from('lineups')
          .select('id')
          .eq('match_id', matchId)
          .eq('team_id', currentTeamId)
          .maybeSingle();

        if (fetchError) {
          throw new Error(`Chyba při hledání sestavy: ${fetchError.message || 'Neznámá chyba'}`);
        }

        // Use existing ID or create a new deterministic UUID
        const lineupId = existingLineup?.id || generateLineupId(matchId, currentTeamId, isHome);

        // Debug: Verify the match exists in database

        await saveLineup(lineupId, {
          ...formDataToSave,
          match_id: matchId,
          team_id: currentTeamId,
          is_home_team: isHome,
        });

        // Refresh summaries
        await loadLineupSummaries();

        // Show success message
        showToast.success('Sestava byla úspěšně uložena!');

        // Close the dialog only on successful save
        if (onClose) {
          onClose();
        }
      } catch (error: any) {
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
    };

    // Expose saveLineup function to parent component
    useImperativeHandle(ref, () => ({
      saveLineup: async () => {
        await handleSaveLineup(selectedTeam === 'home');
      },
    }));

    const handleDeleteLineup = async () => {
      try {
        const currentTeamId = selectedTeam === 'home' ? homeTeamId : awayTeamId;

        // First, find the actual lineup ID from the database

        const {data: lineupData, error: fetchError} = await supabase
          .from('lineups')
          .select('id')
          .eq('match_id', matchId)
          .eq('team_id', currentTeamId)
          .maybeSingle();

        if (fetchError) {
          throw new Error(`Chyba při hledání sestavy: ${fetchError.message || 'Neznámá chyba'}`);
        }

        if (!lineupData) {
          // If no lineup exists, just reset the form data and show success message
          const emptyFormData = {
            match_id: matchId,
            team_id: currentTeamId,
            is_home_team: selectedTeam === 'home',
            players: [],
            coaches: [],
          };

          if (selectedTeam === 'home') {
            setHomeFormData(emptyFormData);
          } else {
            setAwayFormData(emptyFormData);
          }

          await loadLineupSummaries();
          onDeleteModalClose();
          alert('Sestava byla vymazána (neexistovala v databázi)');
          return;
        }

        await deleteLineup(lineupData.id);

        // Reset form data
        const emptyFormData = {
          match_id: matchId,
          team_id: currentTeamId,
          is_home_team: selectedTeam === 'home',
          players: [],
          coaches: [],
        };

        if (selectedTeam === 'home') {
          setHomeFormData(emptyFormData);
        } else {
          setAwayFormData(emptyFormData);
        }

        await loadLineupSummaries();
        onDeleteModalClose();
      } catch (error: any) {
        console.error('Error deleting lineup:', error);
        const errorMessage = error?.message || error?.details || error?.hint || 'Neznámá chyba';
        alert(`Chyba při mazání sestavy: ${errorMessage}`);
      }
    };

    const addPlayer = () => {
      // Clear validation error when user adds players
      if (validationError) {
        setValidationError(null);
      }

      onPlayerSelectionModalOpen();
    };

    const handlePlayerSelected = async (player: LineupPlayerFormData) => {
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
            const isHome = selectedTeam === 'home';
            const currentTeamId = isHome ? homeTeamId : awayTeamId;

            await saveLineup(
              '',
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
    };

    const handleEditPlayer = (index: number) => {
      setEditingPlayerIndex(index);
      setIsPlayerEditModalOpen(true);
    };

    const handleModalClose = () => {
      setEditingPlayerIndex(null);
      onPlayerSelectionModalClose();
    };

    const handlePlayerEditSave = (updatedPlayer: LineupPlayerFormData) => {
      if (editingPlayerIndex !== null) {
        setCurrentFormData((prev) => ({
          ...prev,
          players: prev.players.map((p, i) => (i === editingPlayerIndex ? updatedPlayer : p)),
        }));
        setEditingPlayerIndex(null);
      }
    };

    const handlePlayerEditClose = () => {
      setIsPlayerEditModalOpen(false);
      setEditingPlayerIndex(null);
    };

    const handleDeletePlayer = (index: number) => {
      setDeletingPlayerIndex(index);
      onDeletePlayerModalOpen();
    };

    const confirmDeletePlayer = () => {
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
        onDeletePlayerModalClose();
      }
    };

    const removePlayer = (index: number) => {
      // Clear validation error when user removes players
      if (validationError) {
        setValidationError(null);
      }

      setCurrentFormData((prev) => ({
        ...prev,
        players: prev.players.filter((_, i) => i !== index),
      }));
    };

    const updatePlayer = (index: number, field: keyof LineupPlayerFormData, value: any) => {
      // Clear validation error when user makes changes
      if (validationError) {
        setValidationError(null);
      }

      setCurrentFormData((prev) => ({
        ...prev,
        players: prev.players.map((player, i) =>
          i === index ? {...player, [field]: value} : player
        ),
      }));
    };

    const handleAddCoach = () => {
      setIsCoachSelectionModalOpen(true);
    };

    const handleCoachSelected = (coach: {member_id: string; role: string}) => {
      const coachData: LineupCoachFormData = {
        member_id: coach.member_id,
        role: coach.role as LineupCoachRoles,
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
    };

    const handleEditCoach = (index: number) => {
      setEditingCoachIndex(index);
      setIsCoachEditModalOpen(true);
    };

    const handleCoachEditSave = (updatedCoach: LineupCoachFormData) => {
      if (editingCoachIndex !== null) {
        setCurrentFormData((prev) => ({
          ...prev,
          coaches: prev.coaches.map((c, i) => (i === editingCoachIndex ? updatedCoach : c)),
        }));
        setEditingCoachIndex(null);
      }
    };

    const handleCoachEditClose = () => {
      setIsCoachEditModalOpen(false);
      setEditingCoachIndex(null);
    };

    const handleCoachSelectionClose = () => {
      setIsCoachSelectionModalOpen(false);
      setEditingCoachIndex(null);
    };

    const handleDeleteCoach = (index: number) => {
      setCurrentFormData((prev) => ({
        ...prev,
        coaches: prev.coaches.filter((_, i) => i !== index),
      }));
    };

    const handleUpdateCoach = (index: number, field: keyof LineupCoachFormData, value: any) => {
      setCurrentFormData((prev) => ({
        ...prev,
        coaches: prev.coaches.map((coach, i) => (i === index ? {...coach, [field]: value} : coach)),
      }));
    };

    const getMemberName = (memberId: string) => {
      const member = filteredMembers.find((m) => m.id === memberId);
      return member ? `${member.surname} ${member.name}` : 'Neznámý člen';
    };

    const getAvailableCoaches = () => {
      return filteredMembers.filter((m) => m.functions?.includes('coach'));
    };

    const getLineupSummaryDisplay = (summary: any | null, teamName: string) => {
      if (!summary) {
        return <div className="text-gray-500 text-sm">Žádná sestava</div>;
      }

      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{teamName}</span>
          </div>
          <div className="text-xs text-gray-600 space-x-2">
            <span>Brankáři: {summary.goalkeepers}/2</span>
            <span>Hráči: {summary.field_players}/13</span>
            <span>Trenéři: {summary.coaches}/3</span>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {/* Team Selection */}
        <Card>
          <CardHeader>
            <Heading size={3}>Výběr týmu</Heading>
          </CardHeader>
          <CardBody>
            <div className="flex gap-4">
              <Button
                variant={selectedTeam === 'home' ? 'solid' : 'bordered'}
                color={selectedTeam === 'home' ? 'primary' : 'default'}
                onPress={() => setSelectedTeam('home')}
              >
                {homeTeamName} (Domácí)
              </Button>
              <Button
                variant={selectedTeam === 'away' ? 'solid' : 'bordered'}
                color={selectedTeam === 'away' ? 'primary' : 'default'}
                onPress={() => setSelectedTeam('away')}
              >
                {awayTeamName} (Hosté)
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Lineup Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <Heading size={4}>Domácí tým</Heading>
            </CardHeader>
            <CardBody>{getLineupSummaryDisplay(homeLineupSummary, homeTeamName)}</CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size={4}>Hostující tým</Heading>
            </CardHeader>
            <CardBody>{getLineupSummaryDisplay(awayLineupSummary, awayTeamName)}</CardBody>
          </Card>
        </div>

        {/* Lineup Management */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-blue-500" />
              <Heading size={3}>Sestava: {currentTeamName}</Heading>
            </div>
            <div className="flex gap-2">
              {(currentFormData.players.length > 0 || currentFormData.coaches.length > 0) && (
                <Button
                  color="danger"
                  variant="bordered"
                  startContent={<TrashIcon className="w-4 h-4" />}
                  onPress={onDeleteModalOpen}
                >
                  Smazat sestavu
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner label="Načítání sestavy..." />
              </div>
            ) : currentFormData.players.length === 0 && currentFormData.coaches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Žádná sestava nebyla vytvořena</p>
                <Button
                  color="primary"
                  startContent={<PlusIcon className="w-4 h-4" />}
                  onPress={addPlayer}
                >
                  Přidat prvního hráče
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Players Table */}
                <Tabs>
                  <Tab key="players" title={`Hráči (${currentFormData.players.length})`}>
                    <div>
                      <div className="flex justify-end items-center mb-4">
                        <Button
                          color="primary"
                          startContent={<PlusIcon className="w-4 h-4" />}
                          onPress={addPlayer}
                        >
                          Přidat hráče
                        </Button>
                      </div>
                      <Table aria-label="Players table">
                        <TableHeader>
                          <TableColumn>HRÁČ</TableColumn>
                          <TableColumn>POZICE</TableColumn>
                          <TableColumn>DRES</TableColumn>
                          <TableColumn>GÓLY</TableColumn>
                          <TableColumn>ŽK</TableColumn>
                          <TableColumn>ČK5</TableColumn>
                          <TableColumn>ČK10</TableColumn>
                          <TableColumn>ČKOT</TableColumn>
                          <TableColumn>FUNKCE</TableColumn>
                          <TableColumn>AKCE</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent={'Žádní hráči k zobrazení.'}>
                          {currentFormData.players
                            .sort((a, b) => {
                              // Goalkeepers first
                              if (a.position === 'goalkeeper' && b.position !== 'goalkeeper')
                                return -1;
                              if (a.position !== 'goalkeeper' && b.position === 'goalkeeper')
                                return 1;

                              // Then sort by surname
                              const aName = a.member_id
                                ? getMemberName(a.member_id)
                                : `${a.external_surname || ''} ${a.external_name || ''}`;
                              const bName = b.member_id
                                ? getMemberName(b.member_id)
                                : `${b.external_surname || ''} ${b.external_name || ''}`;
                              return aName.localeCompare(bName);
                            })
                            .map((player, index) => (
                              <TableRow key={index}>
                                <TableCell>{getMemberName(player.member_id || '')}</TableCell>
                                <TableCell>
                                  {player.position === 'goalkeeper' ? 'Brankář' : 'Hráč v poli'}
                                </TableCell>
                                <TableCell>{player.jersey_number || '-'}</TableCell>
                                <TableCell>{player.goals || '-'}</TableCell>
                                <TableCell>{player.yellow_cards || '-'}</TableCell>
                                <TableCell>{player.red_cards_5min || '-'}</TableCell>
                                <TableCell>{player.red_cards_10min || '-'}</TableCell>
                                <TableCell>{player.red_cards_personal || '-'}</TableCell>
                                <TableCell>
                                  {player.role === 'captain' ? 'Kapitán' : 'Hráč'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      color="primary"
                                      variant="light"
                                      onPress={() => handleEditPlayer(index)}
                                      isIconOnly
                                      aria-label="Upravit hráče"
                                      startContent={<PencilIcon className="w-4 h-4" />}
                                    />
                                    <Button
                                      size="sm"
                                      color="danger"
                                      variant="light"
                                      onPress={() => handleDeletePlayer(index)}
                                      isIconOnly
                                      aria-label="Odebrat hráče"
                                      startContent={<TrashIcon className="w-4 h-4" />}
                                    />
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Tab>
                  <Tab key="coaches" title={`Trenéři (${currentFormData.coaches.length})`}>
                    <div>
                      <div className="flex justify-end items-center mb-4">
                        <Button
                          color="primary"
                          startContent={<PlusIcon className="w-4 h-4" />}
                          onPress={handleAddCoach}
                        >
                          Přidat trenéra
                        </Button>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableColumn>TRENÉR</TableColumn>
                        <TableColumn>FUNKCE</TableColumn>
                        <TableColumn>AKCE</TableColumn>
                      </TableHeader>
                      <TableBody emptyContent={'Žádní trenéři k zobrazení.'}>
                        {currentFormData.coaches.map((coach, index) => (
                          <TableRow key={index}>
                            <TableCell>{getMemberName(coach.member_id)}</TableCell>
                            <TableCell>
                              {
                                LINEUP_COACH_ROLES_OPTIONS.find((role) => role.value === coach.role)
                                  ?.label
                              }
                            </TableCell>
                            <TableCell>
                              <ButtonGroup>
                                <Button
                                  size="sm"
                                  color="primary"
                                  variant="light"
                                  onPress={() => handleEditCoach(index)}
                                  isIconOnly
                                  aria-label="Upravit trenéra"
                                  startContent={<PencilIcon className="w-4 h-4" />}
                                />
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="light"
                                  onPress={() => handleDeleteCoach(index)}
                                  isIconOnly
                                  aria-label="Odebrat trenéra"
                                  startContent={<TrashIcon className="w-4 h-4" />}
                                />
                              </ButtonGroup>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Tab>
                </Tabs>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Player Selection Modal */}
        <LineupPlayerSelectionModal
          isOpen={isPlayerSelectionModalOpen}
          onClose={handleModalClose}
          onPlayerSelected={handlePlayerSelected}
          isOwnClub={isOwnClub}
          categoryId={categoryId}
          editingPlayerIndex={editingPlayerIndex}
          currentPlayer={
            editingPlayerIndex !== null ? currentFormData.players[editingPlayerIndex] : null
          }
          teamName={currentTeamName}
          currentLineupPlayers={currentFormData.players}
        />

        {/* Player Edit Modal */}
        <LineupPlayerEditModal
          isOpen={isPlayerEditModalOpen}
          onClose={handlePlayerEditClose}
          onSave={handlePlayerEditSave}
          player={editingPlayerIndex !== null ? currentFormData.players[editingPlayerIndex] : null}
          playerIndex={editingPlayerIndex || 0}
          isOwnClub={isOwnClub}
        />

        {/* Coach Selection Modal */}
        <LineupCoachSelectionModal
          isOpen={isCoachSelectionModalOpen}
          onClose={handleCoachSelectionClose}
          onCoachSelected={handleCoachSelected}
          coaches={getAvailableCoaches()}
          editingCoachIndex={editingCoachIndex}
          currentCoach={
            editingCoachIndex !== null ? currentFormData.coaches[editingCoachIndex] : null
          }
        />

        {/* Coach Edit Modal */}
        <LineupCoachEditModal
          isOpen={isCoachEditModalOpen}
          onClose={handleCoachEditClose}
          onSave={handleCoachEditSave}
          coach={editingCoachIndex !== null ? currentFormData.coaches[editingCoachIndex] : null}
          coachIndex={editingCoachIndex || 0}
          coachName={
            editingCoachIndex !== null
              ? getMemberName(currentFormData.coaches[editingCoachIndex].member_id)
              : ''
          }
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={onDeleteModalClose}
          onConfirm={handleDeleteLineup}
          title="Smazat sestavu"
          message={`Opravdu chcete smazat sestavu pro tým ${currentTeamName}? Tato akce je nevratná.`}
        />

        {/* Delete Player Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={isDeletePlayerModalOpen}
          onClose={onDeletePlayerModalClose}
          onConfirm={confirmDeletePlayer}
          title="Odebrat hráče"
          message="Opravdu chcete odebrat tohoto hráče ze sestavy? Tato akce je nevratná."
        />
      </div>
    );
  }
);

LineupManager.displayName = 'LineupManager';

export default LineupManager;

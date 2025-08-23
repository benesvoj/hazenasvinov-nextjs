'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Select, SelectItem } from '@heroui/select';
import { Badge } from '@heroui/badge';
import { 
  UserGroupIcon, 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useLineupData } from '@/hooks/useLineupData';
import { LineupFormData, LineupPlayerFormData, LineupCoachFormData, Member, ExternalPlayer } from '@/types/types';
import { createClient } from '@/utils/supabase/client';

interface LineupManagerProps {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  members: Member[];
}

interface Team {
  id: string;
  name: string;
  short_name?: string;
  city?: string;
  region?: string;
}

export default function LineupManager({ 
  matchId, 
  homeTeamId, 
  awayTeamId, 
  homeTeamName, 
  awayTeamName, 
  members 
}: LineupManagerProps) {
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [homeFormData, setHomeFormData] = useState<LineupFormData>({
    match_id: matchId,
    team_id: homeTeamId,
    is_home_team: true,
    players: [],
    coaches: []
  });

  const [awayFormData, setAwayFormData] = useState<LineupFormData>({
    match_id: matchId,
    team_id: awayTeamId,
    is_home_team: false,
    players: [],
    coaches: []
  });

  // Determine if the selected team is the user's own club
  const isOwnClub = useMemo(() => {
    // CONFIGURATION: Change this to determine which team is your own club
    // Options:
    // 1. Home team is always your club: return selectedTeam === 'home';
    // 2. Away team is always your club: return selectedTeam === 'away';
    // 3. Specific team ID: return selectedTeam === 'home' ? homeTeamId === 'YOUR_CLUB_ID' : awayTeamId === 'YOUR_CLUB_ID';
    // 4. Based on team name: return selectedTeam === 'home' ? homeTeamName.includes('Your Club') : awayTeamName.includes('Your Club');
    
    // FIXED: Away team is your club (internal players), Home team is other club (external players)
    return selectedTeam === 'away';
    
    // Alternative configurations (uncomment one):
    // return selectedTeam === 'home'; // Home team is your club
    // return homeTeamName.includes('Baník Most') || awayTeamName.includes('Baník Most'); // Based on team name
  }, [selectedTeam]);

  // Get the current form data based on selected team
  const currentFormData = useMemo(() => {
    return selectedTeam === 'home' ? homeFormData : awayFormData;
  }, [selectedTeam, homeFormData, awayFormData]);

  // Get the setter function for current form data
  const setCurrentFormData = useCallback((updater: (prev: LineupFormData) => LineupFormData) => {
    if (selectedTeam === 'home') {
      setHomeFormData(updater);
    } else {
      setAwayFormData(updater);
    }
  }, [selectedTeam]);
  const [homeLineupSummary, setHomeLineupSummary] = useState<any | null>(null);
  const [awayLineupSummary, setAwayLineupSummary] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ExternalPlayer[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const supabase = createClient();
  
  const { 
    isOpen: isEditModalOpen, 
    onOpen: onEditModalOpen, 
    onClose: onEditModalClose 
  } = useDisclosure();
  
  const { 
    isOpen: isDeleteModalOpen, 
    onOpen: onDeleteModalOpen, 
    onClose: onDeleteModalClose 
  } = useDisclosure();

  const {
    fetchLineup,
    saveLineup,
    deleteLineup,
    getLineupSummary,
    searchExternalPlayers,
    loading,
    error
  } = useLineupData();

  const currentTeamId = selectedTeam === 'home' ? homeTeamId : awayTeamId;
  const currentTeamName = selectedTeam === 'home' ? homeTeamName : awayTeamName;

  // Load lineup data when team changes
  const handleLoadLineup = useCallback(async (isHome: boolean) => {
    try {
      const currentTeamId = isHome ? homeTeamId : awayTeamId;
      const lineupData = await fetchLineup(matchId, currentTeamId);
      
      const updatedFormData = {
        match_id: matchId,
        team_id: currentTeamId,
        is_home_team: isHome,
        players: lineupData.players || [],
        coaches: lineupData.coaches || []
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
        coaches: []
      };
      
      if (isHome) {
        setHomeFormData(emptyFormData);
      } else {
        setAwayFormData(emptyFormData);
      }
    }
  }, [matchId, homeTeamId, awayTeamId, fetchLineup]);

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
  const handleSearchExternalPlayers = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results = await searchExternalPlayers(term);
    setSearchResults(results);
    setIsSearching(false);
  }, [searchExternalPlayers]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearchExternalPlayers(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, handleSearchExternalPlayers]);

  // Auto-fill external player data when registration number is entered
  const handleExternalRegistrationNumberChange = useCallback((index: number, value: string) => {
    const player = currentFormData.players[index];
    if (!player) return;

    // Search for existing player with this registration number
    const existingPlayer = searchResults.find(p => p.registration_number === value);
    
    if (existingPlayer) {
      // Auto-fill the player data
      const updatedPlayers = [...currentFormData.players];
      updatedPlayers[index] = {
        ...player,
        external_name: existingPlayer.name,
        external_surname: existingPlayer.surname,
        external_registration_number: existingPlayer.registration_number,
        display_name: `${existingPlayer.name} ${existingPlayer.surname} (${existingPlayer.registration_number})`
      };
      setCurrentFormData(prev => ({ ...prev, players: updatedPlayers }));
    } else {
      // Just update the registration number
      const updatedPlayers = [...currentFormData.players];
      updatedPlayers[index] = {
        ...player,
        external_registration_number: value
      };
      setCurrentFormData(prev => ({ ...prev, players: updatedPlayers }));
    }
  }, [currentFormData, searchResults, setCurrentFormData]);

  const handleSaveLineup = async (isHome: boolean) => {
    try {
      const currentTeamId = isHome ? homeTeamId : awayTeamId;
      
      // Create or get lineup ID
      const lineupId = `${matchId}_${currentTeamId}_${isHome ? 'home' : 'away'}`;
      
      // Debug: Log what we're trying to save
      console.log('Saving lineup with data:', {
        lineupId,
        currentFormData,
        isHome,
        currentTeamId,
        matchId,
        homeTeamId,
        awayTeamId
      });
      
      // Debug: Verify the match exists in database
      console.log('Match ID being used:', matchId);
      console.log('Team IDs being used:', { homeTeamId, awayTeamId });
      
      await saveLineup(lineupId, {
        ...currentFormData,
        match_id: matchId,
        team_id: currentTeamId,
        is_home_team: isHome
      });
      
      // Refresh summaries
      await loadLineupSummaries();
      
      // Show success message
      alert('Sestava byla úspěšně uložena!');
    } catch (error) {
      console.error('Error saving lineup:', error);
      alert(`Chyba při ukládání sestavy: ${error instanceof Error ? error.message : 'Neznámá chyba'}`);
    }
  };

  const handleDeleteLineup = async () => {
    try {
      const currentTeamId = selectedTeam === 'home' ? homeTeamId : awayTeamId;
      const lineupId = `${matchId}_${currentTeamId}_${selectedTeam === 'home' ? 'home' : 'away'}`;
      
      await deleteLineup(lineupId);
      
      // Reset form data
      const emptyFormData = {
        match_id: matchId,
        team_id: currentTeamId,
        is_home_team: selectedTeam === 'home',
        players: [],
        coaches: []
      };
      
      if (selectedTeam === 'home') {
        setHomeFormData(emptyFormData);
      } else {
        setAwayFormData(emptyFormData);
      }
      
      await loadLineupSummaries();
      onDeleteModalClose();
    } catch (error) {
      console.error('Error deleting lineup:', error);
      alert(`Chyba při mazání sestavy: ${error instanceof Error ? error.message : 'Neznámá chyba'}`);
    }
  };

  const addPlayer = () => {
    const newPlayer: LineupPlayerFormData = {
      is_external: !isOwnClub, // External if not own club, internal if own club
      position: 'field_player',
      role: 'player'
    };
    
    setCurrentFormData(prev => ({
      ...prev,
      players: [...prev.players, newPlayer]
    }));
  };

  const removePlayer = (index: number) => {
    setCurrentFormData(prev => ({
      ...prev,
      players: prev.players.filter((_, i) => i !== index)
    }));
  };

  const updatePlayer = (index: number, field: keyof LineupPlayerFormData, value: any) => {
    setCurrentFormData(prev => ({
      ...prev,
      players: prev.players.map((player, i) => 
        i === index ? { ...player, [field]: value } : player
      )
    }));
  };

  const addCoach = () => {
    setCurrentFormData(prev => ({
      ...prev,
      coaches: [...prev.coaches, {
        member_id: '',
        role: 'assistant_coach'
      }]
    }));
  };

  const removeCoach = (index: number) => {
    setCurrentFormData(prev => ({
      ...prev,
      coaches: prev.coaches.filter((_, i) => i !== index)
    }));
  };

  const updateCoach = (index: number, field: keyof LineupCoachFormData, value: any) => {
    setCurrentFormData(prev => ({
      ...prev,
      coaches: prev.coaches.map((coach, i) => 
        i === index ? { ...coach, [field]: value } : coach
      )
    }));
  };

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member ? `${member.name} ${member.surname}` : 'Neznámý člen';
  };

  const getAvailableMembers = (type: 'player' | 'coach') => {
    if (type === 'player') {
      return members.filter(m => m.functions?.includes('player'));
    } else {
      return members.filter(m => m.functions?.includes('coach'));
    }
  };

  const getLineupSummaryDisplay = (summary: any | null, teamName: string) => {
    if (!summary) {
      return (
        <div className="text-gray-500 text-sm">
          Žádná sestava
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge color={summary.is_valid ? 'success' : 'danger'} variant="flat">
            {summary.is_valid ? 'Validní' : 'Nevalidní'}
          </Badge>
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
          <h3 className="text-lg font-semibold">Výběr týmu</h3>
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
            <h4 className="text-md font-medium">Domácí tým</h4>
          </CardHeader>
          <CardBody>
            {getLineupSummaryDisplay(homeLineupSummary, homeTeamName)}
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>
            <h4 className="text-md font-medium">Hostující tým</h4>
          </CardHeader>
          <CardBody>
            {getLineupSummaryDisplay(awayLineupSummary, awayTeamName)}
          </CardBody>
        </Card>
      </div>

      {/* Lineup Management */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold">
              Sestava: {currentTeamName}
            </h3>
          </div>
          <div className="flex gap-2">
            <Button
              color="primary"
              startContent={<PencilIcon className="w-4 h-4" />}
              onPress={onEditModalOpen}
            >
              Upravit sestavu
            </Button>
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
          {currentFormData.players.length === 0 && currentFormData.coaches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Žádná sestava nebyla vytvořena
            </div>
          ) : (
            <div className="space-y-4">
              {/* Players Section */}
              {currentFormData.players.length > 0 && (
                <div>
                  <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Hráči ({currentFormData.players.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentFormData.players.map((player, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-gray-50">
                        <div className="text-sm text-gray-600">
                          {player.member_id ? (
                            getMemberName(player.member_id)
                          ) : (
                            `${player.external_name} ${player.external_surname}`
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {player.position === 'goalkeeper' ? 'Brankář' : 'Hráč v poli'}
                        </div>
                        {player.role && (
                          <div className="text-xs text-gray-500">
                            Role: {player.role}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coaches Section */}
              {currentFormData.coaches.length > 0 && (
                <div>
                  <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Trenéři ({currentFormData.coaches.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentFormData.coaches.map((coach, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-blue-50">
                        <div className="text-sm font-medium">
                          {getMemberName(coach.member_id)}
                        </div>
                        <div className="text-xs text-gray-600">
                          {coach.role === 'head_coach' ? 'Hlavní trenér' : 
                           coach.role === 'assistant_coach' ? 'Asistent' : 
                           coach.role === 'goalkeeper_coach' ? 'Trenér brankářů' : coach.role}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Lineup Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose} size="4xl">
        <ModalContent>
          <ModalHeader>Upravit sestavu: {currentTeamName}</ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Players Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-lg font-medium">Hráči</h4>
                  <Button
                    size="sm"
                    color="primary"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={addPlayer}
                  >
                    Přidat hráče
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {currentFormData.players.map((player, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <div className="mb-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {isOwnClub ? (
                            // Internal player form (own club)
                            <>
                              <Select
                                label="Hráč"
                                selectedKeys={player.member_id ? [player.member_id] : []}
                                onSelectionChange={(keys: any) => {
                                  const selectedKey = Array.from(keys)[0] as string;
                                  updatePlayer(index, 'member_id', selectedKey);
                                }}
                                placeholder="Vyberte hráče"
                              >
                                {members.map((member) => (
                                  <SelectItem key={member.id}>
                                    {member.name} {member.surname} ({member.registration_number})
                                  </SelectItem>
                                ))}
                              </Select>
                              
                              <Select
                                label="Pozice"
                                selectedKeys={[player.position]}
                                onSelectionChange={(keys: any) => {
                                  const selectedKey = Array.from(keys)[0] as string;
                                  updatePlayer(index, 'position', selectedKey);
                                }}
                              >
                                <SelectItem key="goalkeeper">Brankář</SelectItem>
                                <SelectItem key="field_player">Hráč v poli</SelectItem>
                              </Select>
                              
                              <Select
                                label="Role"
                                selectedKeys={player.role ? [player.role] : []}
                                onSelectionChange={(keys: any) => {
                                  const selectedKey = Array.from(keys)[0] as string;
                                  updatePlayer(index, 'role', selectedKey);
                                }}
                              >
                                <SelectItem key="player">Hráč</SelectItem>
                                <SelectItem key="captain">Kapitán</SelectItem>
                                <SelectItem key="vice_captain">Vicekapitán</SelectItem>
                              </Select>
                            </>
                          ) : (
                            // External player form (other club)
                            <>
                              <Input
                                label="Registrační číslo"
                                placeholder="Reg. číslo"
                                value={player.external_registration_number || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePlayer(index, 'external_registration_number', e.target.value)}
                                onBlur={() => handleExternalRegistrationNumberChange(index, player.external_registration_number || '')}
                              />
                              <Input
                                label="Jméno"
                                placeholder="Jméno"
                                value={player.external_name || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePlayer(index, 'external_name', e.target.value)}
                              />
                              <Input
                                label="Příjmení"
                                placeholder="Příjmení"
                                value={player.external_surname || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePlayer(index, 'external_surname', e.target.value)}
                              />
                              <Select
                                label="Pozice"
                                selectedKeys={[player.position]}
                                onSelectionChange={(keys: any) => {
                                  const selectedKey = Array.from(keys)[0] as string;
                                  updatePlayer(index, 'position', selectedKey);
                                }}
                              >
                                <SelectItem key="goalkeeper">Brankář</SelectItem>
                                <SelectItem key="field_player">Hráč v poli</SelectItem>
                              </Select>
                              
                              <Select
                                label="Role"
                                selectedKeys={player.role ? [player.role] : []}
                                onSelectionChange={(keys: any) => {
                                  const selectedKey = Array.from(keys)[0] as string;
                                  updatePlayer(index, 'role', selectedKey);
                                }}
                              >
                                <SelectItem key="player">Hráč</SelectItem>
                                <SelectItem key="captain">Kapitán</SelectItem>
                                <SelectItem key="vice_captain">Vicekapitán</SelectItem>
                              </Select>
                            </>
                          )}
                        </div>
                        
                        <div className="mt-3 flex justify-end">
                          <Button
                            size="sm"
                            color="danger"
                            variant="bordered"
                            startContent={<TrashIcon className="w-4 h-4" />}
                            onPress={() => removePlayer(index)}
                          >
                            Odebrat
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coaches Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-lg font-medium">Trenéři</h4>
                  <Button
                    size="sm"
                    color="primary"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={addCoach}
                  >
                    Přidat trenéra
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {currentFormData.coaches.map((coach, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-blue-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Select
                          label="Trenér"
                          selectedKeys={[coach.member_id]}
                          onSelectionChange={(keys: any) => updateCoach(index, 'member_id', Array.from(keys)[0])}
                          isRequired
                        >
                          {getAvailableMembers('coach').map((member) => (
                            <SelectItem key={member.id}>
                              {member.name} {member.surname} ({member.registration_number})
                            </SelectItem>
                          ))}
                        </Select>
                        
                        <Select
                          label="Role"
                          selectedKeys={[coach.role]}
                          onSelectionChange={(keys: any) => updateCoach(index, 'role', Array.from(keys)[0])}
                          isRequired
                        >
                          <SelectItem key="head_coach">Hlavní trenér</SelectItem>
                          <SelectItem key="assistant_coach">Asistent</SelectItem>
                          <SelectItem key="goalkeeper_coach">Trenér brankářů</SelectItem>
                        </Select>
                      </div>
                      
                      <div className="mt-3 flex justify-end">
                        <Button
                          size="sm"
                          color="danger"
                          variant="bordered"
                          startContent={<TrashIcon className="w-4 h-4" />}
                          onPress={() => removeCoach(index)}
                        >
                          Odebrat
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation Summary */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                  <div className="font-medium">Chyba:</div>
                  <div className="text-sm">{error}</div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onEditModalClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={() => handleSaveLineup(selectedTeam === 'home')} isLoading={loading}>
              Uložit sestavu
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
        <ModalContent>
          <ModalHeader>Smazat sestavu</ModalHeader>
          <ModalBody>
            <p>
              Opravdu chcete smazat sestavu pro tým <strong>{currentTeamName}</strong>?
              Tato akce je nevratná.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteModalClose}>
              Zrušit
            </Button>
            <Button color="danger" onPress={handleDeleteLineup} isLoading={loading}>
              Smazat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

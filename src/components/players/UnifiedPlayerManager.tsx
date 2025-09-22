'use client';

import {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import {useUnifiedPlayers} from '@/hooks/useUnifiedPlayers';
import {PlayerSearchFilters, PlayerSearchResult} from '@/types/unifiedPlayer';
import {PlayerLoanModal} from '@/components';
import {Input} from '@heroui/input';
import {Select, SelectItem, Button} from '@heroui/react';
import {ArrowPathIcon, CheckIcon, PlusIcon} from '@heroicons/react/24/outline';
import CreateMemberModal from '@/app/admin/matches/components/CreateMemberModal';
import CreateExternalPlayerModal from '@/app/admin/matches/components/CreateExternalPlayerModal';

interface UnifiedPlayerManagerProps {
  clubId?: string;
  showExternalPlayers?: boolean;
  onPlayerSelected?: (player: PlayerSearchResult) => void;
  categoryId?: string;
  teamName?: string;
}

export default function UnifiedPlayerManager({
  clubId,
  showExternalPlayers = true,
  onPlayerSelected,
  categoryId,
  teamName,
}: UnifiedPlayerManagerProps) {
  const {searchPlayers, getPlayersByClub, loading, error} = useUnifiedPlayers();

  const [players, setPlayers] = useState<PlayerSearchResult[]>([]);
  const [filters, setFilters] = useState<PlayerSearchFilters>({
    club_id: clubId,
    is_external: showExternalPlayers ? undefined : false,
    category_id: categoryId,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showCreateMemberModal, setShowCreateMemberModal] = useState(false);
  const [showCreateExternalPlayerModal, setShowCreateExternalPlayerModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerSearchResult | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadPlayers = useCallback(async () => {
    const searchFilters = {
      ...filters,
      search_term: searchTerm,
      club_id: clubId || filters.club_id,
      category_id: categoryId || filters.category_id,
    };

    const data = await searchPlayers(searchFilters);
    setPlayers(data);
  }, [filters, searchTerm, clubId, categoryId, searchPlayers]);

  // Separate function for search that doesn't depend on loadPlayers
  const performSearch = useCallback(
    async (term: string) => {
      const searchFilters = {
        club_id: clubId,
        is_external: showExternalPlayers ? undefined : false,
        category_id: categoryId,
        search_term: term,
      };

      const data = await searchPlayers(searchFilters);
      setPlayers(data);
    },
    [clubId, showExternalPlayers, categoryId, searchPlayers]
  );

  // Load initial players
  useEffect(() => {
    performSearch('');
  }, [performSearch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);

      // Clear existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout for debounced search
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(term);
      }, 300);
    },
    [performSearch]
  );

  const handleFilterChange = (newFilters: Partial<PlayerSearchFilters>) => {
    setFilters((prev) => ({...prev, ...newFilters}));
  };

  const handlePlayerAction = (player: PlayerSearchResult, action: 'select' | 'loan') => {
    setSelectedPlayer(player);

    if (action === 'select') {
      onPlayerSelected?.(player);
    } else if (action === 'loan') {
      setShowLoanModal(true);
    }
  };

  const handleMemberCreated = (member: {
    id: string;
    name: string;
    surname: string;
    registration_number: string;
  }) => {
    // Create a PlayerSearchResult from the new member
    const newPlayer: PlayerSearchResult = {
      id: member.id,
      name: member.name,
      surname: member.surname,
      registration_number: member.registration_number,
      position: undefined,
      jersey_number: undefined,
      is_external: false,
      current_club_name: 'TJ Sokol Svinov',
      display_name: `${member.surname} ${member.name} (${member.registration_number})`,
    };

    // Add the new player to the list
    setPlayers((prev) => [newPlayer, ...prev]);

    // Select the new player
    if (onPlayerSelected) {
      onPlayerSelected(newPlayer);
    }
  };

  const handleExternalPlayerCreated = (player: PlayerSearchResult) => {
    // Add the new external player to the list
    setPlayers((prev) => [player, ...prev]);

    // Select the new player
    if (onPlayerSelected) {
      onPlayerSelected(player);
    }
  };

  const getPlayerTypeBadge = (isExternal: boolean) => {
    if (isExternal) {
      return (
        <span className="inline-flex rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
          Externí
        </span>
      );
    }
    return (
      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
        Interní
      </span>
    );
  };

  const getPositionBadge = (position?: string) => {
    if (!position) return null;

    const positionColors = {
      goalkeeper: 'bg-blue-100 text-blue-800',
      field_player: 'bg-purple-100 text-purple-800',
    };

    const positionLabels = {
      goalkeeper: 'Brankář',
      field_player: 'Hráč v poli',
    };

    return (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${positionColors[position as keyof typeof positionColors]}`}
      >
        {positionLabels[position as keyof typeof positionLabels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">Načítání hráčů...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded bg-red-50 p-4">
        <div className="text-sm text-red-800">Chyba při načítání hráčů: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex gap-4">
        <Input
          key="search-input"
          label="Hledat hráče"
          type="search"
          placeholder="Jméno, příjmení nebo registrační číslo..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <Select
          label="Typ hráče"
          value={filters.is_external === undefined ? '' : filters.is_external.toString()}
          selectedKeys={filters.is_external === undefined ? [] : [filters.is_external.toString()]}
          onSelectionChange={(keys) => {
            const selectedKey = Array.from(keys)[0] as string;
            handleFilterChange({
              is_external: selectedKey === '' ? undefined : selectedKey === 'true',
            });
          }}
        >
          <SelectItem key="all">Všichni</SelectItem>
          <SelectItem key="false">Interní</SelectItem>
          <SelectItem key="true">Externí</SelectItem>
        </Select>
      </div>

      {/* Create Player Button - Different for internal vs external */}
      <div className="flex justify-end">
        {!showExternalPlayers ? (
          <Button
            color="primary"
            variant="bordered"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={() => setShowCreateMemberModal(true)}
          >
            Vytvořit nového člena
          </Button>
        ) : (
          <Button
            color="primary"
            variant="bordered"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={() => setShowCreateExternalPlayerModal(true)}
          >
            Vytvořit externího hráče
          </Button>
        )}
      </div>

      {/* Players List */}
      <div className="space-y-2">
        {players.length === 0 ? (
          <div className="rounded bg-gray-50 p-8 text-center">
            <div className="text-sm text-gray-500">Žádní hráči nenalezeni</div>
          </div>
        ) : (
          players.map((player) => (
            <div key={player.id} className="rounded border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-sm font-medium text-gray-900">{player.display_name}</h3>
                    {getPlayerTypeBadge(player.is_external)}
                    {getPositionBadge(player.position)}
                    {player.jersey_number && (
                      <span className="text-xs text-gray-500">#{player.jersey_number}</span>
                    )}
                  </div>

                  {player.current_club_name && (
                    <div className="mt-1 text-sm text-gray-600">
                      <strong>Klub:</strong> {player.current_club_name}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onPress={() => handlePlayerAction(player, 'select')}
                    isIconOnly
                    startContent={<CheckIcon className="w-4 h-4" />}
                    aria-label="Vybrat hráče"
                  />
                  <Button
                    onPress={() => handlePlayerAction(player, 'loan')}
                    isIconOnly
                    size="sm"
                    startContent={<ArrowPathIcon className="w-4 h-4" />}
                    aria-label="Půjčit hráče"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Loan Modal */}
      <PlayerLoanModal
        isOpen={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        playerId={selectedPlayer?.id}
        onLoanCreated={() => {
          setShowLoanModal(false);
          setSelectedPlayer(null);
        }}
      />

      {/* Create Member Modal */}
      <CreateMemberModal
        isOpen={showCreateMemberModal}
        onClose={() => setShowCreateMemberModal(false)}
        onMemberCreated={handleMemberCreated}
        categoryId={categoryId}
      />

      {/* Create External Player Modal */}
      <CreateExternalPlayerModal
        isOpen={showCreateExternalPlayerModal}
        onClose={() => setShowCreateExternalPlayerModal(false)}
        onPlayerCreated={handleExternalPlayerCreated}
        teamName={teamName}
      />
    </div>
  );
}

'use client';

import {useState, useEffect, useCallback} from 'react';
import {useUnifiedPlayers} from '@/hooks/useUnifiedPlayers';
import {PlayerSearchFilters, PlayerSearchResult} from '@/types/unifiedPlayer';
import {PlayerLoanModal} from '@/components';

interface UnifiedPlayerManagerProps {
  clubId?: string;
  showExternalPlayers?: boolean;
  onPlayerSelected?: (player: PlayerSearchResult) => void;
}

export default function UnifiedPlayerManager({
  clubId,
  showExternalPlayers = true,
  onPlayerSelected,
}: UnifiedPlayerManagerProps) {
  const {searchPlayers, getPlayersByClub, loading, error} = useUnifiedPlayers();

  const [players, setPlayers] = useState<PlayerSearchResult[]>([]);
  const [filters, setFilters] = useState<PlayerSearchFilters>({
    club_id: clubId,
    is_external: showExternalPlayers ? undefined : false,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerSearchResult | null>(null);

  const loadPlayers = useCallback(async () => {
    const searchFilters = {
      ...filters,
      search_term: searchTerm,
      club_id: clubId || filters.club_id,
    };

    const data = await searchPlayers(searchFilters);
    setPlayers(data);
  }, [filters, searchTerm, clubId, searchPlayers]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Debounce search
    const timeoutId = setTimeout(() => {
      loadPlayers();
    }, 300);

    return () => clearTimeout(timeoutId);
  };

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
      <div className="rounded bg-white p-4 shadow-sm">
        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Hledat hráče</label>
            <input
              type="text"
              placeholder="Jméno, příjmení nebo registrační číslo..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Typ hráče</label>
              <select
                value={filters.is_external === undefined ? '' : filters.is_external.toString()}
                onChange={(e) =>
                  handleFilterChange({
                    is_external: e.target.value === '' ? undefined : e.target.value === 'true',
                  })
                }
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Všichni</option>
                <option value="false">Interní</option>
                <option value="true">Externí</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Pozice</label>
              <select
                value={filters.position || ''}
                onChange={(e) => handleFilterChange({position: e.target.value || undefined})}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Všechny</option>
                <option value="goalkeeper">Brankář</option>
                <option value="field_player">Hráč v poli</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.is_active === undefined ? '' : filters.is_active.toString()}
                onChange={(e) =>
                  handleFilterChange({
                    is_active: e.target.value === '' ? undefined : e.target.value === 'true',
                  })
                }
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Všichni</option>
                <option value="true">Aktivní</option>
                <option value="false">Neaktivní</option>
              </select>
            </div>
          </div>
        </div>
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
                  <button
                    onClick={() => handlePlayerAction(player, 'select')}
                    className="rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                  >
                    Vybrat
                  </button>
                  <button
                    onClick={() => handlePlayerAction(player, 'loan')}
                    className="rounded bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-200"
                  >
                    Půjčit
                  </button>
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
    </div>
  );
}

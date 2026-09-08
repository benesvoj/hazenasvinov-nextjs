'use client';

import {useState, useEffect, useCallback, useRef, useMemo} from 'react';

import {Select, SelectItem, Button, Input, Switch} from '@heroui/react';

import {CheckIcon, PlusIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {getClubName} from '@/constants';
import {useAppDataSafe} from '@/contexts';
import {PlayerPosition} from '@/enums';
import {CreateExternalPlayerModal, CreateMemberModal} from '@/features/lineupManager';
import {getCallUpCategories} from '@/helpers';
import {useUnifiedPlayers} from '@/hooks';
import {PlayerSearchFilters, PlayerSearchResult, UnifiedPlayerManagerProps} from '@/types';
import {hasItems} from '@/utils';

const tPlayers = translations.lineupManager.unifiedPlayerManager;

export default function UnifiedPlayerManager({
  clubId,
  showExternalPlayers = true,
  onPlayerSelected,
  categoryId,
  teamName,
  excludePlayerIds = [],
  onMemberCreated,
  allowOtherCategories = false,
}: UnifiedPlayerManagerProps) {
  const {searchPlayers, getPlayersByClub, loading, error} = useUnifiedPlayers();
  // Safe variant: this component also renders under /matches, which mounts no
  // AppDataProvider. Without the category list the call-up switch simply has
  // nothing to offer and stays hidden, rather than throwing.
  const appData = useAppDataSafe();
  const categories = appData?.categories.data;

  /** Widens the search from this category to every category of the same gender. */
  const [showOtherCategories, setShowOtherCategories] = useState(false);

  const callUpCategoryIds = useMemo(
    () => getCallUpCategories(categories ?? [], categoryId).map((category) => category.id),
    [categories, categoryId]
  );

  /** No categories to widen into means no switch — an inert toggle is worse than none. */
  const canCallUp = allowOtherCategories && hasItems(callUpCategoryIds);

  const categoryFilter = useMemo(
    (): Pick<PlayerSearchFilters, 'category_id' | 'category_ids'> =>
      showOtherCategories && hasItems(callUpCategoryIds)
        ? {category_ids: callUpCategoryIds}
        : {category_id: categoryId},
    [showOtherCategories, callUpCategoryIds, categoryId]
  );

  const [players, setPlayers] = useState<PlayerSearchResult[]>([]);
  const [filters, setFilters] = useState<PlayerSearchFilters>({
    club_id: clubId,
    is_external: showExternalPlayers ? undefined : false,
    category_id: categoryId,
  });

  // Filter out player-manager that are already in the lineup
  const filteredPlayers = useMemo(() => {
    return players.filter((player) => !excludePlayerIds.includes(player.id));
  }, [players, excludePlayerIds]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateMemberModal, setShowCreateMemberModal] = useState(false);
  const [showCreateExternalPlayerModal, setShowCreateExternalPlayerModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerSearchResult | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadPlayers = useCallback(async () => {
    const searchFilters = {
      ...filters,
      ...categoryFilter,
      search_term: searchTerm,
      club_id: clubId || filters.club_id,
    };

    const data = await searchPlayers(searchFilters);
    setPlayers(data);
  }, [filters, categoryFilter, searchTerm, clubId, searchPlayers]);

  // Separate function for search that doesn't depend on loadPlayers
  const performSearch = useCallback(
    async (term: string) => {
      // Determine the is_external filter based on context and user selection
      let isExternalFilter: boolean | undefined;

      if (showExternalPlayers) {
        // When showing external player-manager, use the filter selection
        isExternalFilter = filters.is_external;
      } else {
        // When showing internal player-manager, always filter for internal only
        isExternalFilter = false;
      }

      const searchFilters = {
        club_id: clubId,
        is_external: isExternalFilter,
        ...categoryFilter,
        search_term: term,
      };

      const data = await searchPlayers(searchFilters);
      setPlayers(data);
    },
    [clubId, filters.is_external, categoryFilter, searchPlayers, showExternalPlayers]
  );

  // Load initial player-manager
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    performSearch('');
  }, [performSearch]);

  // Trigger search when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    performSearch(searchTerm);
  }, [filters.is_external, performSearch, searchTerm]);

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

  const handlePlayerAction = (player: PlayerSearchResult, action: 'select') => {
    setSelectedPlayer(player);

    if (action === 'select') {
      onPlayerSelected?.(player);
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
      current_club_name: getClubName(),
      display_name: `${member.surname} ${member.name} (${member.registration_number})`,
    };

    // Add the new player to the list
    setPlayers((prev) => [newPlayer, ...prev]);

    // Select the new player
    if (onPlayerSelected) {
      onPlayerSelected(newPlayer);
    }

    // Notify parent component to refresh member list
    if (onMemberCreated) {
      onMemberCreated();
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

  /**
   * Names the player's category, and marks it when it is not the one the match
   * belongs to — otherwise a call-up is indistinguishable from a squad player
   * in a list that no longer filters by category.
   */
  const getCategoryBadge = (player: PlayerSearchResult) => {
    if (!player.category_name) return null;

    const isCallUp = Boolean(categoryId) && player.category_id !== categoryId;

    return (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
          isCallUp ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
        }`}
      >
        {isCallUp ? `${tPlayers.calledUp}: ${player.category_name}` : player.category_name}
      </span>
    );
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

  // todo"
  const getPositionBadge = (position?: string) => {
    if (!position) return null;

    const positionColors = {
      [PlayerPosition.GOALKEEPER]: 'bg-blue-100 text-blue-800',
      [PlayerPosition.FIELD_PLAYER]: 'bg-purple-100 text-purple-800',
    };

    const positionLabels = {
      [PlayerPosition.GOALKEEPER]: translations.lineups.enums.playerPosition.goalkeeper,
      [PlayerPosition.FIELD_PLAYER]: translations.lineups.enums.playerPosition.fieldPlayer,
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
        <div className="text-sm text-gray-500">{translations.common.loading}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded bg-red-50 p-4">
        <div className="text-sm text-red-800">
          {translations.lineupManager.unifiedPlayerManager.error}: {error}
        </div>
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
        {showExternalPlayers && (
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
        )}
      </div>

      {/*
        Off by default: the coach's own category is the normal case, and a list
        of every player in the club would bury it. Turning it on is what a
        call-up looks like.
      */}
      {canCallUp && (
        <Switch
          size="sm"
          isSelected={showOtherCategories}
          onValueChange={setShowOtherCategories}
          aria-label={tPlayers.showOtherCategories}
        >
          <span className="text-sm">
            {showOtherCategories ? tPlayers.showOtherCategories : tPlayers.ownCategoryOnly}
          </span>
        </Switch>
      )}
      {canCallUp && showOtherCategories && (
        <p className="text-xs text-gray-500">{tPlayers.showOtherCategoriesHint}</p>
      )}

      {/* Create Player Button - Different for internal vs external */}
      <div className="flex justify-end">
        <Button
          color="primary"
          variant="bordered"
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={() => setShowCreateMemberModal(true)}
        >
          {translations.common.actions.create}
        </Button>
      </div>

      {/* Players List */}
      <div className="space-y-2">
        {filteredPlayers.length === 0 ? (
          <div className="rounded bg-gray-50 p-8 text-center">
            <div className="text-sm text-gray-500">
              {players.length === 0 ? 'Žádní hráči nenalezeni' : 'Všichni hráči jsou již v sestavě'}
            </div>
          </div>
        ) : (
          filteredPlayers.map((player) => (
            <div key={player.id} className="rounded border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-sm font-medium text-gray-900">{player.display_name}</h3>
                    {getCategoryBadge(player)}
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
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Member Modal */}
      <CreateMemberModal
        isOpen={showCreateMemberModal}
        onClose={() => setShowCreateMemberModal(false)}
        onMemberCreated={handleMemberCreated}
        categoryId={categoryId}
        clubId={clubId}
      />

      {/* Create External Player Modal */}
      <CreateExternalPlayerModal
        isOpen={showCreateExternalPlayerModal}
        onClose={() => setShowCreateExternalPlayerModal(false)}
        onPlayerCreated={handleExternalPlayerCreated}
        teamName={teamName}
        categoryId={categoryId} // Passed categoryId to determine gender
      />
    </div>
  );
}

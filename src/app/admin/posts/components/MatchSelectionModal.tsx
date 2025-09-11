'use client';

import React, {useState, useMemo} from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Input,
  Select,
  SelectItem,
  Spinner,
} from '@heroui/react';
import {Match} from '@/types';
import {useFetchMatches} from '@/hooks';
import {formatDateString} from '@/helpers';
import {formatTime} from '@/helpers/formatTime';
import {matchStatuses} from '@/constants';

interface MatchSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (match: Match | null) => void;
  selectedMatchId?: string;
  categoryId?: string;
}

export default function MatchSelectionModal({
  isOpen,
  onClose,
  onSelect,
  selectedMatchId,
  categoryId,
}: MatchSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const statusFilterOptions = matchStatuses;

  // Use the existing hook to fetch matches (only when modal is open and categoryId is provided)
  const {
    matches: seasonalMatches,
    loading,
    error,
  } = useFetchMatches(
    isOpen && categoryId ? categoryId : '',
    undefined, // Use active season
    {
      ownClubOnly: true, // Only show own club matches
      includeTeamDetails: true,
    }
  );

  // Flatten seasonal matches into a single array and sort by date (newest first)
  const allMatches = useMemo(() => {
    try {
      const all = [...(seasonalMatches?.autumn || []), ...(seasonalMatches?.spring || [])];
      const sorted = all.sort((a, b) => {
        try {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        } catch (dateError) {
          console.warn('Date sorting error:', dateError);
          return 0;
        }
      });

      // Debug logging removed - component now has proper error handling

      return sorted;
    } catch (error) {
      console.error('Error processing matches:', error);
      return [];
    }
  }, [seasonalMatches]);

  // Filter matches based on search and status
  const filteredMatches = useMemo(() => {
    try {
      return allMatches.filter((match) => {
        // Ensure match has required data
        if (!match || !match.home_team || !match.away_team) {
          return false;
        }

        const matchesSearch =
          !searchTerm ||
          match.home_team?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          match.away_team?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          match.competition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          match.venue?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || match.status === statusFilter;

        return matchesSearch && matchesStatus;
      });
    } catch (error) {
      console.error('Error filtering matches:', error);
      return [];
    }
  }, [allMatches, searchTerm, statusFilter]);

  // Don't render if no categoryId is provided
  if (!categoryId) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-semibold">Vyberte zápas</h2>
          </ModalHeader>
          <ModalBody>
            <div className="text-center py-8 text-gray-500">Nejdříve vyberte kategorii článku</div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Zavřít
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  const handleSelect = (match: Match) => {
    onSelect(match);
    onClose();
  };

  const handleClear = () => {
    onSelect(null);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case matchStatuses.completed:
        return 'success';
      case matchStatuses.upcoming:
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-semibold">Vyberte zápas</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="bordered" onPress={handleClear}>
                Zrušit výběr
              </Button>
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Hledat zápasy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select
              placeholder="Stav zápasu"
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
              className="w-48"
            >
              <>
                <SelectItem key="all">Všechny stavy</SelectItem>
                {Object.entries(matchStatuses).map(([key, value]) => (
                  <SelectItem key={key}>{value}</SelectItem>
                ))}
              </>
            </Select>
          </div>

          {/* Matches Table */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {error.message || 'Chyba při načítání zápasů'}
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Žádné zápasy nenalezeny</div>
          ) : (
            <Table aria-label="Matches table">
              <TableHeader>
                <TableColumn>Datum</TableColumn>
                <TableColumn>Čas</TableColumn>
                <TableColumn>Zápas</TableColumn>
                <TableColumn>Výsledek</TableColumn>
                <TableColumn>Stav</TableColumn>
                <TableColumn>Akce</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredMatches
                  .filter((match) => match && match.id) // Filter out invalid matches
                  .map((match) => (
                    <TableRow key={match.id}>
                      <TableCell>{formatDateString(match.date)}</TableCell>
                      <TableCell>{formatTime(match.time)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {match.home_team?.name || 'Neznámý tým'} vs{' '}
                            {match.away_team?.name || 'Neznámý tým'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {match.competition || 'Neznámá soutěž'} •{' '}
                            {match.venue || 'Neznámé místo'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {match.category?.name || 'Neznámá kategorie'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {match.status === 'completed' &&
                        match.home_score !== null &&
                        match.away_score !== null ? (
                          <div className="space-y-1">
                            <div className="text-lg font-bold">
                              {match.home_score} : {match.away_score}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" color={getStatusColor(match.status)} variant="flat">
                          {matchStatuses[match.status]}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          color="primary"
                          variant={selectedMatchId === match.id ? 'solid' : 'bordered'}
                          onPress={() => handleSelect(match)}
                        >
                          {selectedMatchId === match.id ? 'Vybraný' : 'Vybrat'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Zavřít
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

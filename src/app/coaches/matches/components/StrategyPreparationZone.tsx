'use client';

import React, {useState} from 'react';

import {Card, CardHeader, CardBody, Button, Tabs, Tab} from '@heroui/react';

import {ClipboardDocumentListIcon, XMarkIcon} from '@heroicons/react/24/outline';

import {useStrategyPreparation} from '@/hooks/coach/useStrategyPreparation';

import {Match, Nullish} from '@/types';

import {TabWithHeadToHead, TabWithStrategy, TabWithVideos, TabWithPreviousMatches} from './';

interface StrategyPreparationZoneProps {
  selectedMatch: Match | Nullish;
  onClose: () => void;
}

export default function StrategyPreparationZone({
  selectedMatch,
  onClose,
}: StrategyPreparationZoneProps) {
  const [activeTab, setActiveTab] = useState('strategy');

  // Use the custom hook for all business logic
  const {
    previousMatches,
    previousMatchesLoading,
    previousMatchesError,
    headToHeadMatches,
    headToHeadLoading,
    headToHeadError,
    ourClubTeamIds,
    filteredOpponentVideos,
    videosLoading,
    videosError,
    opponentTeam,
  } = useStrategyPreparation(selectedMatch);

  if (!selectedMatch) {
    return null;
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <ClipboardDocumentListIcon className="w-5 h-5 text-purple-600 flex-shrink-0" />
          <h3 className="text-lg sm:text-xl font-semibold truncate">Strategie a příprava</h3>
        </div>
        <Button isIconOnly variant="light" size="sm" onPress={onClose} className="flex-shrink-0">
          <XMarkIcon className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardBody className="p-0">
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
          <h4 className="font-semibold text-base sm:text-lg mb-2">Vybraný zápas</h4>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>
              <strong>Datum:</strong> {new Date(selectedMatch.date).toLocaleDateString('cs-CZ')}
            </p>
            <p>
              <strong>Čas:</strong>{' '}
              {new Date(selectedMatch.date).toLocaleTimeString('cs-CZ', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p>
              <strong>Domácí:</strong> {selectedMatch.home_team?.name || 'Neznámý tým'}
            </p>
            <p>
              <strong>Hosté:</strong> {selectedMatch.away_team?.name || 'Neznámý tým'}
            </p>
            {opponentTeam && (
              <p className="mt-2 text-purple-600 dark:text-purple-400">
                <strong>Soupeř:</strong> {opponentTeam.name}
              </p>
            )}
          </div>
        </div>

        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          className="px-2 sm:px-4 mt-4"
          variant="solid"
        >
          <Tab key="strategy" title="Strategie">
            <TabWithStrategy />
          </Tab>

          <Tab key="videos" title="Videa soupeře">
            <TabWithVideos
              videosError={videosError}
              videosLoading={videosLoading}
              filteredOpponentVideos={filteredOpponentVideos}
              opponentTeam={opponentTeam}
            />
          </Tab>
          <Tab key="previousMatches" title="Předchozí zápasy soupeře">
            <TabWithPreviousMatches
              previousMatchesError={previousMatchesError?.message || null}
              previousMatchesLoading={previousMatchesLoading}
              previousMatches={previousMatches}
              opponentTeam={opponentTeam}
            />
          </Tab>
          <Tab key="headToHead" title="Vzájemné zápasy">
            <TabWithHeadToHead
              headToHeadError={headToHeadError?.message || null}
              headToHeadLoading={headToHeadLoading}
              headToHeadMatches={headToHeadMatches}
              opponentTeam={opponentTeam}
              ourClubTeamIds={ourClubTeamIds}
            />
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
}

import React from 'react';

import {Button} from '@heroui/react';

import {PencilIcon, PlusIcon, TrashIcon} from '@heroicons/react/24/solid';

import {translations} from '@/lib/translations';

import {ContentCard, EmptyState, Heading} from '@/components';
import {CategoryLineup} from '@/types';
import {isEmpty} from '@/utils';

interface LineupsListProps {
  selectedCategory: string | null;
  selectedSeason: string | null;
  selectedLineupId: string | null;
  setSelectedLineup: (lineup: CategoryLineup) => void;
  loading: boolean;
  lineupsList: CategoryLineup[];
  onAddLineup: () => void;
  onEditLineup: (lineup: CategoryLineup) => void;
  onDeleteLineup: (lineupId: string) => void;
}

const t = translations.lineups;

export const LineupsList = ({
  loading,
  selectedLineupId,
  setSelectedLineup,
  selectedSeason,
  selectedCategory,
  lineupsList,
  onAddLineup: handleAddClick,
  onEditLineup: handleEditLineup,
  onDeleteLineup: handleDeleteLineup,
}: LineupsListProps) => {
  const actions = (
    <Button
      size="sm"
      color="primary"
      startContent={<PlusIcon className="w-4 h-4" />}
      onPress={handleAddClick}
      isDisabled={!selectedCategory || !selectedSeason}
    >
      {t.actions.newLineup}
    </Button>
  );

  const emptyContent = (
    <EmptyState
      title={t.emptyState.title}
      description={t.emptyState.description}
      action={actions}
    />
  );

  return (
    <ContentCard
      title={t.titles.title}
      actions={actions}
      isLoading={loading}
      emptyState={isEmpty(lineupsList) && emptyContent}
    >
      <div className="space-y-2">
        {lineupsList.map((lineup) => (
          <div
            key={lineup.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedLineupId === lineup.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedLineup(lineup)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Heading size={4}>{lineup.name}</Heading>
                {lineup.description && (
                  <p className="text-xs text-gray-500 mt-1">{lineup.description}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="light"
                  startContent={<PencilIcon className="w-4 h-4" />}
                  isIconOnly
                  aria-label={`${t.titles.update} ${lineup.name}`}
                  onPress={() => handleEditLineup(lineup)}
                />
                <Button
                  size="sm"
                  color="danger"
                  variant="light"
                  onPress={() => handleDeleteLineup(lineup.id)}
                  isIconOnly
                  aria-label={`${t.titles.delete} ${lineup.name}`}
                  startContent={<TrashIcon className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </ContentCard>
  );
};

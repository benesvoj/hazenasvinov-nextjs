import React from 'react';

import {Button, Card, CardBody, CardHeader, Skeleton} from '@heroui/react';

import {PencilIcon, PlusIcon, TrashIcon} from '@heroicons/react/24/solid';

import {Heading} from '@/components';
import {translations} from '@/lib';
import {CategoryLineup} from '@/types';

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

const t = translations.coachPortal.lineupList;

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
  return (
    <div className="lg:col-span-1">
      <Card>
        <CardHeader className="flex items-center justify-between w-full">
          <Heading size={3}>{t.title}</Heading>
          <Button
            size="sm"
            color="primary"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={handleAddClick}
            isDisabled={!selectedCategory || !selectedSeason}
          >
            Nová soupiska
          </Button>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : lineupsList.length === 0 ? (
            <p className="text-gray-500 text-center py-4">{t.noLineups}</p>
          ) : (
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
                        aria-label={`${t.updateLineup} ${lineup.name}`}
                        onPress={() => handleEditLineup(lineup)}
                      />
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={() => handleDeleteLineup(lineup.id)}
                        isIconOnly
                        aria-label={`${t.deleteLineup} ${lineup.name}`}
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
  );
};

'use client';

import React from 'react';

import {Button} from '@heroui/react';

import {PencilIcon, TrashIcon} from '@heroicons/react/24/solid';

import {translations} from '@/lib/translations';

import {Heading} from '@/components';

interface LineupListItemProps {
  lineup: {
    id: string;
    name: string;
    description?: string;
  };
  selectedLineupId: string | null;
  setSelectedLineup: (lineup: {id: string; name: string; description?: string}) => void;
  handleEditLineup: (lineup: {id: string; name: string; description?: string}) => void;
  handleDeleteLineup: (lineupId: string) => void;
}

export const LineupListItem = (props: LineupListItemProps) => {
  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        props.selectedLineupId === props.lineup.id
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => props.setSelectedLineup(props.lineup)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Heading size={4}>{props.lineup.name}</Heading>
          {props.lineup.description && (
            <p className="text-xs text-gray-500 mt-1">{props.lineup.description}</p>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="light"
            startContent={<PencilIcon className="w-4 h-4" />}
            isIconOnly
            aria-label={`${translations.lineups.titles.update} ${props.lineup.name}`}
            onPress={() => props.handleEditLineup(props.lineup)}
          />
          <Button
            size="sm"
            color="danger"
            variant="light"
            onPress={() => props.handleDeleteLineup(props.lineup.id)}
            isIconOnly
            aria-label={`${translations.lineups.titles.delete} ${props.lineup.name}`}
            startContent={<TrashIcon className="w-4 h-4" />}
          />
        </div>
      </div>
    </div>
  );
};

import React from 'react';

import {ExclamationTriangleIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {HStack, VStack} from '@/components';

interface YellowCardsCardItemProps {
  order: number;
  name: string;
  jersey_number?: number;
  registration_number?: string;
  position?: string;
  yellow_cards: number;
  matches_played: number;
}

export const YellowCardsCardItem = (props: YellowCardsCardItemProps) => {
  return (
    <HStack
      justify={'between'}
      padding={3}
      className="bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full"
    >
      <HStack spacing={2}>
        <HStack
          justify={'center'}
          align={'center'}
          className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-semibold"
        >
          {props.order}
        </HStack>
        <VStack spacing={2} align={'start'}>
          <div className="font-medium text-gray-900 dark:text-white">{props.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            #{props.jersey_number || props.registration_number}
            {props.position && ` • ${props.position}`}
          </div>
        </VStack>
      </HStack>
      <VStack align={'end'}>
        <HStack spacing={2}>
          <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
          <span className="text-lg font-bold text-yellow-600">{props.yellow_cards}</span>
        </HStack>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {props.matches_played} {translations.coachPortal.yellowCardsCard.labels.matchesPlayed}
        </div>
      </VStack>
    </HStack>
  );
};

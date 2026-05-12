import React from 'react';

import {XCircleIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {HStack, VStack} from '@/components';

interface RedCardsCardItemProps {
  order: number;
  name: string;
  jersey_number?: number;
  registration_number?: string;
  position?: string;
  red_cards_5min: number;
  red_cards_10min: number;
  red_cards_personal: number;
  matches_played: number;
}

export const RedCardsCardItem = (props: RedCardsCardItemProps) => {
  return (
    <HStack
      justify={'between'}
      align={'center'}
      padding={3}
      className="bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full"
    >
      <HStack spacing={3}>
        <HStack
          justify={'center'}
          align={'center'}
          className="w-8 h-8 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm font-semibold"
        >
          {props.order}
        </HStack>
        <HStack spacing={2}>
          <div className="font-medium text-gray-900 dark:text-white">{props.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            #{props.jersey_number || props.registration_number}
            {props.position && ` • ${props.position}`}
          </div>
        </HStack>
      </HStack>
      <VStack align={'end'}>
        <HStack spacing={2}>
          <XCircleIcon className="w-4 h-4 text-red-500" />
          <span className="text-lg font-bold text-red-600">
            {props.red_cards_5min + props.red_cards_10min + props.red_cards_personal}
          </span>
        </HStack>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {props.matches_played} {translations.coachPortal.redCardsCard.labels.matchesPlayed}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {props.red_cards_5min > 0 &&
            `${props.red_cards_5min}${translations.coachPortal.redCardsCard.labels['5min']}`}
          {props.red_cards_10min > 0 &&
            `${props.red_cards_10min}${translations.coachPortal.redCardsCard.labels['10min']}`}
          {props.red_cards_personal > 0 &&
            `${props.red_cards_personal}${translations.coachPortal.redCardsCard.labels.personal}`}
        </div>
      </VStack>
    </HStack>
  );
};

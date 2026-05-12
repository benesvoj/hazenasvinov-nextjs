import React from 'react';

import {FireIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {HStack, VStack} from '@/components';

interface TopScorersCardItemProps {
  order: number;
  name: string;
  jerseyNumber?: number;
  registrationNumber?: string;
  position?: string;
  goals: number;
  average_goals_per_match: number;
}

export const TopScorersCardItem = (props: TopScorersCardItemProps) => {
  return (
    <HStack
      padding={3}
      justify={'between'}
      align={'center'}
      className="bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full"
    >
      <HStack spacing={3}>
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
            #{props.jerseyNumber || props.registrationNumber}
            {props.position && ` • ${props.position}`}
          </div>
        </VStack>
      </HStack>
      <VStack align={'end'}>
        <HStack spacing={2}>
          <FireIcon className="w-4 h-4 text-orange-500" />
          <span className="text-lg font-bold text-orange-600">{props.goals}</span>
        </HStack>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {props.average_goals_per_match.toFixed(2)}{' '}
          {translations.coachPortal.bestScorersCard.labels.goalsPerMatch}
        </div>
      </VStack>
    </HStack>
  );
};

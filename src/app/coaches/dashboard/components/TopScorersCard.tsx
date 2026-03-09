'use client';

import React from 'react';

import {Alert} from '@heroui/alert';

import {TrophyIcon} from '@heroicons/react/24/outline';

import {usePlayerStats} from '@/hooks/entities/player/usePlayerStats';

import {translations} from '@/lib/translations';

import {TopScorersCardItem} from '@/app/coaches/dashboard/components/TopScorersCardItem';

import {ContentCard, EmptyState, HStack, VStack} from '@/components';
import {getCount, isEmpty} from '@/utils';

interface TopScorersCardProps {
  categoryId?: string;
}

export default function TopScorersCard({categoryId}: TopScorersCardProps) {
  const {topScorers, loading, error} = usePlayerStats(categoryId);

  const title = (
    <HStack spacing={2}>
      <TrophyIcon className="w-5 h-5 text-yellow-600" />
      {translations.coachPortal.bestScorersCard.title}
    </HStack>
  );

  const emptyState = (
    <EmptyState
      title={translations.coachPortal.bestScorersCard.emptyState.title}
      description={translations.coachPortal.bestScorersCard.emptyState.description}
      icon={<TrophyIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />}
    />
  );

  const errorState = (
    <HStack justify={'center'}>
      <Alert
        color={'danger'}
        description={translations.coachPortal.labels.fetchingCardError(error)}
      />
    </HStack>
  );

  const footer = (
    <HStack className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        {translations.coachPortal.bestScorersCard.labels.top5}
      </p>
    </HStack>
  );

  return (
    <ContentCard
      isLoading={loading}
      title={title}
      emptyState={isEmpty(topScorers) && emptyState}
      errorState={error && errorState}
      footer={getCount(topScorers) > 4 && footer}
    >
      <VStack spacing={2}>
        {topScorers.map((player, index) => (
          <TopScorersCardItem
            key={player.id}
            order={index + 1}
            name={`${player.name} ${player.surname}`}
            jerseyNumber={player.jersey_number}
            registrationNumber={player.registration_number}
            position={player.position}
            goals={player.goals}
            average_goals_per_match={player.average_goals_per_match}
          />
        ))}
      </VStack>
    </ContentCard>
  );
}

'use client';

import React from 'react';

import {Alert} from '@heroui/alert';

import {ExclamationTriangleIcon} from '@heroicons/react/24/outline';

import {usePlayerStats} from '@/hooks/entities/player/usePlayerStats';

import {translations} from '@/lib/translations';

import {YellowCardsCardItem} from '@/app/coaches/dashboard/components/YellowCardsCardItem';

import {ContentCard, EmptyState, HStack, VStack} from '@/components';
import {getCount, isEmpty} from '@/utils';

interface YellowCardsCardProps {
  categoryId?: string;
}

export default function YellowCardsCard({categoryId}: YellowCardsCardProps) {
  const {yellowCardPlayers, loading, error} = usePlayerStats(categoryId);

  const title = (
    <div className="flex items-center gap-2">
      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
      {translations.coachPortal.yellowCardsCard.title}
    </div>
  );

  const emptyState = (
    <EmptyState
      title={translations.coachPortal.yellowCardsCard.emptyState.title}
      description={translations.coachPortal.yellowCardsCard.emptyState.description}
      icon={<ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />}
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
        {translations.coachPortal.yellowCardsCard.labels.top5}
      </p>
    </HStack>
  );

  return (
    <ContentCard
      title={title}
      isLoading={loading}
      emptyState={isEmpty(yellowCardPlayers) && emptyState}
      errorState={error && errorState}
      footer={getCount(yellowCardPlayers) > 4 && footer}
    >
      <VStack spacing={2}>
        {yellowCardPlayers.map((player, index) => (
          <YellowCardsCardItem
            key={player.id}
            order={index + 1}
            name={player.name + ' ' + player.surname}
            jersey_number={player.jersey_number}
            registration_number={player.registration_number}
            position={player.position}
            yellow_cards={player.yellow_cards}
            matches_played={player.matches_played}
          />
        ))}
      </VStack>
    </ContentCard>
  );
}

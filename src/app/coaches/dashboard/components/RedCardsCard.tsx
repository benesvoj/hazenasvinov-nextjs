'use client';

import React from 'react';

import {Card, CardBody, CardHeader} from '@heroui/react';

import {XCircleIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {RedCardsCardItem} from '@/app/coaches/dashboard/components/RedCardsCardItem';

import {ContentCard, EmptyState, HStack, VStack} from '@/components';
import {usePlayerStats} from '@/hooks';
import {isEmpty} from '@/utils';

interface RedCardsCardProps {
  categoryId?: string;
}

export default function RedCardsCard({categoryId}: RedCardsCardProps) {
  const {redCardPlayers, loading, error} = usePlayerStats(categoryId);

  if (error) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircleIcon className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold">Červené karty</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Chyba při načítání statistik: {error}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const title = (
    <HStack spacing={2}>
      <XCircleIcon className="w-5 h-5 text-red-600" />
      {translations.coachPortal.redCardsCard.title}
    </HStack>
  );

  const emptyContent = (
    <EmptyState
      title={translations.coachPortal.redCardsCard.emptyState.title}
      description={translations.coachPortal.redCardsCard.emptyState.description}
      icon={<XCircleIcon className="w-12 h-12 mx-auto text-gray-400" />}
    />
  );

  return (
    <ContentCard
      title={title}
      isLoading={loading}
      emptyState={isEmpty(redCardPlayers) && emptyContent}
    >
      <VStack spacing={2}>
        {redCardPlayers.map((player, index) => (
          <RedCardsCardItem
            key={player.id}
            order={index + 1}
            name={`${player.name} ${player.surname}`}
            jersey_number={player.jersey_number}
            registration_number={player.registration_number}
            position={player.position}
            red_cards_5min={player.red_cards_5min}
            red_cards_10min={player.red_cards_10min}
            red_cards_personal={player.red_cards_personal}
            matches_played={player.matches_played}
          />
        ))}
      </VStack>
      {redCardPlayers.length === 5 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Zobrazuje se top 5 hráčů s červenými kartami
          </p>
        </div>
      )}
    </ContentCard>
  );
}

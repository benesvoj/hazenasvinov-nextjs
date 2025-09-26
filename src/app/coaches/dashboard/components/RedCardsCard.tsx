'use client';

import React from 'react';
import {Card, CardBody, CardHeader} from '@heroui/react';
import {XCircleIcon} from '@heroicons/react/24/outline';
import {usePlayerStats} from '@/hooks/entities/player/usePlayerStats';
import {LoadingSpinner} from '@/components';

interface RedCardsCardProps {
  categoryId?: string;
}

export default function RedCardsCard({categoryId}: RedCardsCardProps) {
  const {redCardPlayers, loading, error} = usePlayerStats(categoryId);

  if (loading) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircleIcon className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold">Červené karty</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardBody>
      </Card>
    );
  }

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

  if (redCardPlayers.length === 0) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircleIcon className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold">Červené karty</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8 text-gray-500">
            <XCircleIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Žádné červené karty</p>
            <p className="text-sm">Zatím nebyly odehrány žádné zápasy</p>
            <p className="text-xs text-gray-400 mt-2">
              Statistiky se zobrazí po odehrání prvních zápasů
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-2">
          <XCircleIcon className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold">Červené karty</h3>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {redCardPlayers.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {player.name} {player.surname}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      #{player.jersey_number || player.registration_number}
                      {player.position && ` • ${player.position}`}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <XCircleIcon className="w-4 h-4 text-red-500" />
                  <span className="text-lg font-bold text-red-600">
                    {player.red_cards_5min + player.red_cards_10min + player.red_cards_personal}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {player.matches_played} zápasů
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {player.red_cards_5min > 0 && `${player.red_cards_5min}×5min `}
                  {player.red_cards_10min > 0 && `${player.red_cards_10min}×10min `}
                  {player.red_cards_personal > 0 && `${player.red_cards_personal}×osobní`}
                  {player.red_cards_5min === 0 &&
                    player.red_cards_10min === 0 &&
                    player.red_cards_personal === 0 &&
                    'Žádné červené karty'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {redCardPlayers.length === 5 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Zobrazuje se top 5 hráčů s červenými kartami
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

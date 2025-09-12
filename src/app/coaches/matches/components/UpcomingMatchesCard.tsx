'use client';

import React from 'react';
import {Card, CardHeader, CardBody} from '@heroui/react';
import {CalendarIcon} from '@heroicons/react/24/outline';
import {MatchRow} from '@/components';
import {LoadingSpinner} from '@/components';

interface UpcomingMatchesCardProps {
  upcomingMatches: any[];
  loading: boolean;
  onMatchSelect?: (match: any) => void;
  selectedMatchId?: string;
}

export default function UpcomingMatchesCard({
  upcomingMatches,
  loading,
  onMatchSelect,
  selectedMatchId,
}: UpcomingMatchesCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-blue-600" />
        <h3 className="text-xl font-semibold">Nadcházející zápasy</h3>
      </CardHeader>
      <CardBody className="p-0">
        {loading ? (
          <div className="p-6">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto scrollbar-hide">
            <div className="space-y-0">
              {upcomingMatches.map((match) => (
                <div
                  key={match.id}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedMatchId === match.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                      : ''
                  }`}
                  onClick={() => onMatchSelect?.(match)}
                >
                  <MatchRow match={match} redirectionLinks={false} />
                </div>
              ))}
              {upcomingMatches.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-2">Žádné nadcházející zápasy</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

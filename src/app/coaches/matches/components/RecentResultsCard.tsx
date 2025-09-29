'use client';

import React from 'react';

import {Card, CardHeader, CardBody} from '@heroui/react';

import {TrophyIcon} from '@heroicons/react/24/outline';

import {LoadingSpinner, Heading, MatchRow} from '@/components';

interface RecentResultsCardProps {
  recentResults: any[];
  loading: boolean;
  onMatchSelect?: (match: any) => void;
  selectedMatchId?: string;
}

export default function RecentResultsCard({
  recentResults,
  loading,
  onMatchSelect,
  selectedMatchId,
}: RecentResultsCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex items-center gap-2">
        <TrophyIcon className="w-5 h-5 text-green-600" />
        <Heading size={3}>Poslední výsledky</Heading>
      </CardHeader>
      <CardBody className="p-0">
        {loading ? (
          <div className="p-6">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-y-auto scrollbar-hide">
            <div className="space-y-0">
              {recentResults.map((match) => (
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
              {recentResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-2">Žádné nedávné výsledky</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

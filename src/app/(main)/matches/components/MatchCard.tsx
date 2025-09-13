'use client';

import React from 'react';
import {Card, CardBody} from '@heroui/card';
import Link from '@/components/Link';
import {Match} from '@/types';
import {MapPinIcon} from '@heroicons/react/24/outline';
import {
  formatDateToDayAndMonth,
  formatDateToWeekday,
  formatDateString,
  formatTime,
} from '@/helpers';
import TeamDisplay from './TeamDisplay';
import TeamDisplayMobile from './TeamDisplayMobile';
import {MatchScore} from '@/components';
interface MatchCardProps {
  match: Match;
}

export default function MatchCard({match}: MatchCardProps) {
  return (
    <Link href={`/matches/${match.id}`} className="block">
      <Card className="hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
        <CardBody className="p-4 px-6 sm:p-4">
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            {/* Date and Time - Top */}
            <div className="flex mb-3 items-end">
              <div className="flex flex-col">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDateToWeekday(match.date)}
                </div>
                <div className="font-semibold text-sm text-gray-900 dark:text-white">
                  {formatDateString(match.date)}
                </div>
              </div>
              <div className="text-right pl-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {formatTime(match.time)}
                </div>
              </div>
            </div>

            {/* Teams vs Score Layout */}
            <div className="flex items-center justify-between">
              {/* Teams - Left Side */}
              <div className="flex-1 min-w-0">
                <div className="space-y-2">
                  {/* Home Team */}
                  <TeamDisplay team={match.home_team} fallbackName="Home team" />

                  {/* Away Team */}
                  <TeamDisplay team={match.away_team} fallbackName="Away team" />
                </div>
              </div>

              {/* Score - Right Side */}
              <div className="flex-shrink-0 ml-4">
                {match.status === 'completed' ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      {match.home_score !== undefined ? match.home_score : '-'}
                    </span>
                    <span className="text-gray-400">:</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      {match.away_score !== undefined ? match.away_score : '-'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-bold text-gray-400">-:-</span>
                  </div>
                )}
              </div>
            </div>

            {/* Category and Venue - Bottom */}
            <div className="mt-2 space-y-1 flex justify-between">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {match.category?.name} {match.matchweek && `- ${match.matchweek}. kolo`}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 flex">
                <MapPinIcon className="w-3 h-3 mr-1" />
                {match.venue || ''}
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            {/* Date and Time - Left Side */}
            <div className="flex flex-col items-start min-w-[120px]">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatDateToWeekday(match.date)}
              </div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {formatDateToDayAndMonth(match.date)}
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatTime(match.time)}
              </div>
            </div>

            {/* Teams and Info - Center */}
            <div className="flex-1 flex flex-col items-center mx-4">
              {/* Teams Row */}
              <div className="flex items-center gap-4 mb-2">
                {/* Home Team */}
                <TeamDisplayMobile
                  team={match.home_team}
                  fallbackName="Home team"
                  isHomeTeam={true}
                />

                <span className="text-gray-400 text-sm">x</span>

                {/* Away Team */}
                <TeamDisplayMobile
                  team={match.away_team}
                  fallbackName="Away team"
                  isHomeTeam={false}
                />
              </div>

              {/* Venue and League Info */}
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {match.category?.name} {match.matchweek && `- ${match.matchweek}. kolo`}
                  <MapPinIcon className="w-3 h-3 inline ml-1" /> {match.venue || 'Venue'}
                </div>
              </div>
            </div>

            {/* Score - Right Side */}
            <div className="flex flex-col items-end min-w-[100px]">
              <MatchScore match={match} />
              {/* {match.status === matchStatusesKeys[1] ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {match.home_score !== undefined ? match.home_score : "-"}
                  </span>
                  <span className="text-gray-400">:</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {match.away_score !== undefined ? match.away_score : "-"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-400">-:-</span>
                </div>
              )} */}
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}

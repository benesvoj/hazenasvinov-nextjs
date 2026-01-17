'use client';

import React from 'react';

import Image from 'next/image';

import {Button, Divider} from '@heroui/react';

import {TrophyIcon} from '@heroicons/react/24/outline';

import Link from '@/components/ui/link/Link';

import {MatchScore} from '@/components';
import {formatDateToDayAndMonth, formatDateToWeekday, formatTime} from '@/helpers';
import {Match} from '@/types';

interface MatchRowProps {
  match: Match;
  compact?: boolean;
  redirectionLinks: boolean;
  onStartResultFlow?: (match: Match) => void;
  showResultButton?: boolean;
  showSeason?: boolean;
}

const MatchRow: React.FC<MatchRowProps> = ({
  match,
  compact = true,
  redirectionLinks = true,
  onStartResultFlow,
  showResultButton = false,
  showSeason = false,
}) => {
  const handleResultButtonClick = () => {
    onStartResultFlow?.(match);
  };

  return (
    <div className="border rounded-lg p-3 lg:p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <Link href={redirectionLinks ? `/matches/${match.id}` : '#'} className="block">
        <div className="flex items-center justify-between px-2">
          {/* Date and Time - Left Side */}
          <div
            className={`flex flex-col items-start ${
              compact ? 'min-w-[40px] lg:min-w-[40px]' : 'min-w-[100px] lg:min-w-[120px]'
            }`}
          >
            <div className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
              {formatDateToWeekday(match.date)}
            </div>
            <div className="font-semibold text-gray-900 dark:text-white text-sm lg:text-base">
              {formatDateToDayAndMonth(match.date)}
            </div>
            <div className="text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300">
              {formatTime(match.time)}
            </div>
          </div>

          {/* Teams and Info - Center */}
          <div className="flex-1 flex flex-col items-start mx-2 lg:ml-4">
            {/* Teams Row */}
            <div className="flex items-center gap-2 mb-2">
              {/* Home Team */}
              <div className="flex items-center gap-2">
                {/* Logo - Hidden on mobile */}
                {(match.home_team_logo || match.home_team?.logo_url) && (
                  <div className="hidden lg:block">
                    <Image
                      src={match.home_team_logo || match.home_team?.logo_url || ''}
                      alt={`${match.home_team?.name || 'Home team'} logo`}
                      width={32}
                      height={32}
                      className="w-8 h-8 object-contain rounded-full"
                      style={{width: 'auto', height: 'auto'}}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <span className={'font-medium text-sm lg:text-sm text-gray-900 dark:text-white'}>
                  {/* Mobile: Short name with suffix, Desktop: Full name */}
                  <span className="lg:hidden">
                    {match.home_team?.short_name || match.home_team?.name}
                  </span>
                  <span className="hidden lg:inline">{match.home_team?.name}</span>
                </span>
              </div>

              <span className="text-gray-400 text-xs lg:text-sm">x</span>

              {/* Away Team */}
              <div className="flex items-center gap-2">
                <span className={'font-medium text-sm lg:text-sm text-gray-900 dark:text-white'}>
                  {/* Mobile: Short name with suffix, Desktop: Full name */}
                  <span className="lg:hidden">
                    {match.away_team?.short_name || match.away_team?.name}
                  </span>
                  <span className="hidden lg:inline">{match.away_team?.name}</span>
                </span>
                {/* Logo - Hidden on mobile */}
                {(match.away_team_logo || match.away_team?.logo_url) && (
                  <div className="hidden lg:block">
                    <Image
                      src={match.away_team_logo || match.away_team?.logo_url || ''}
                      alt={`${match.away_team?.name || 'Away team'} logo`}
                      width={32}
                      height={32}
                      className="w-8 h-8 object-contain rounded-full"
                      style={{width: 'auto', height: 'auto'}}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Venue and League Info */}
            <div className="flex h-5 items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
              {/* Mobile: Shorter text, Desktop: Full text */}
              <div className="lg:hidden flex flex-col items-start">
                <div>{match.category?.name}</div>
                <div>{match.venue}</div>
              </div>
              <div className="hidden lg:inline">
                {`${match.category?.name} - ${match.category?.description}`}
              </div>
              {match.venue && (
                <>
                  <Divider orientation="vertical" />
                  <div>{match.venue}</div>
                </>
              )}
              {showSeason && (
                <>
                  <Divider orientation="vertical" />
                  <div>Ročník: {match.season?.name}</div>
                </>
              )}
            </div>
          </div>

          {/* Score - Right Side */}
          <div
            className={`flex flex-col items-end ${
              compact ? 'min-w-[40px] lg:min-w-[60px]' : 'min-w-[60px] lg:min-w-[80px]'
            }`}
          >
            <MatchScore match={match} />
          </div>
        </div>
      </Link>

      {/* Result Flow Button - Only show for upcoming matches when enabled */}
      {showResultButton && match.status === 'upcoming' && onStartResultFlow && (
        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            color="success"
            variant="flat"
            startContent={<TrophyIcon className="w-4 h-4" />}
            onPress={handleResultButtonClick}
            className="text-xs"
          >
            Zaznamenat výsledek
          </Button>
        </div>
      )}
    </div>
  );
};

export default MatchRow;

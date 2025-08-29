'use client';

import React from "react";
import { Card, CardBody } from "@heroui/card";
import Link from "@/components/Link";
import Image from 'next/image';
import { Match } from "@/types";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { formatDateToDayAndMonth, formatDateToWeekday, formatTime } from "@/helpers";

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {

  return (
    <Link href={`/matches/${match.id}`} className="block">
      <Card className="hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
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
                <div className="flex items-center gap-3">
                  {match.home_team?.logo_url && (
                    <Image 
                      src={match.home_team.logo_url} 
                      alt={`${match.home_team?.name || 'Home team'} logo`}
                      width={32}
                      height={32}
                      className="w-8 h-8 object-contain rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <span className={`font-medium ${match.home_team?.is_own_club ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                    {match.home_team?.name || 'Home team'}
                  </span>
                </div>
                
                <span className="text-gray-400 text-sm">x</span>
                
                {/* Away Team */}
                <div className="flex items-center gap-3">
                  <span className={`font-medium ${match.away_team?.is_own_club ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                    {match.away_team?.name || 'Away team'}
                  </span>
                  {match.away_team?.logo_url && (
                    <Image 
                      src={match.away_team.logo_url} 
                      alt={`${match.away_team?.name || 'Away team'} logo`}
                      width={32}
                      height={32}
                      className="w-8 h-8 object-contain rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </div>
              
                          {/* Venue and League Info */}
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {match.category?.name} {match.matchweek && (`- ${match.matchweek}. kolo`)} 
                  <MapPinIcon className="w-3 h-3 inline ml-1" /> {match.venue || 'Venue'}
                </div>
              </div>
            </div>

            {/* Score - Right Side (removed button) */}
            <div className="flex flex-col items-end min-w-[100px]">
              {match.status === "completed" ? (
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
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}

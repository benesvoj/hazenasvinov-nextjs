import React from "react";
import Link from "@/components/Link";
import { MapPinIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import {
  formatDateToDayAndMonth,
  formatDateToWeekday,
  formatTime,
} from "@/helpers";
import { Match } from "@/types";

interface MatchRowProps {
  match: Match;
  compact?: boolean;
}

const MatchRow: React.FC<MatchRowProps> = ({ match, compact = true }) => {
  return (
    <Link href={`/matches/${match.id}`} className="block">
      <div className="border rounded-lg p-3 lg:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
        <div className="flex items-center justify-between">
          {/* Date and Time - Left Side */}
          <div
            className={`flex flex-col items-start ${
              compact
                ? "min-w-[40px] lg:min-w-[40px]"
                : "min-w-[100px] lg:min-w-[120px]"
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
          <div className="flex-1 flex flex-col items-start mx-2 lg:mx-4">
            {/* Teams Row */}
            <div className="flex items-center gap-2 lg:gap-4 mb-2">
              {/* Home Team */}
              <div className="flex items-center gap-2 lg:gap-3">
                {/* Logo - Hidden on mobile */}
                {(match.home_team_logo || match.home_team?.logo_url) && (
                  <div className="hidden lg:block">
                    <Image
                      src={match.home_team_logo || match.home_team?.logo_url || ''}
                      alt={`${match.home_team?.name || 'Home team'} logo`}
                      width={32}
                      height={32}
                      className="w-8 h-8 object-contain rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
                <span
                  className={`font-medium text-sm lg:text-sm ${
                    match.home_team_is_own_club
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {/* Mobile: Short name, Desktop: Full name */}
                  <span className="lg:hidden">
                    {match.home_team?.short_name || match.home_team?.name || "Neznámý tým"}
                  </span>
                  <span className="hidden lg:inline">
                    {match.home_team?.name || "Neznámý tým"}
                  </span>
                </span>
              </div>

              <span className="text-gray-400 text-xs lg:text-sm">x</span>

              {/* Away Team */}
              <div className="flex items-center gap-2 lg:gap-3">
                <span
                  className={`font-medium text-sm lg:text-sm ${
                    match.away_team_is_own_club
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {/* Mobile: Short name, Desktop: Full name */}
                  <span className="lg:hidden">
                    {match.away_team?.short_name || match.away_team?.name || "Neznámý tým"}
                  </span>
                  <span className="hidden lg:inline">
                    {match.away_team?.name || "Neznámý tým"}
                  </span>
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
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Venue and League Info */}
            <div className="text-center">
              <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 mb-1">
                {/* Mobile: Shorter text, Desktop: Full text */}
                <span className="lg:hidden">
                  {match.category?.name}{" "}
                  <MapPinIcon className="w-3 h-3 inline ml-1" /> {match.venue}
                </span>
                <span className="hidden lg:inline">
                  {match.category?.description ||
                    match.category?.name}
                    {match.venue && (
                      <>
                        {" "}
                        <MapPinIcon className="w-3 h-3 inline ml-2" /> {match.venue}
                      </>
                    )}
                </span>
              </div>
            </div>
          </div>

          {/* Score - Right Side */}
          <div
            className={`flex flex-col items-end ${
              compact
                ? "min-w-[40px] lg:min-w-[60px]"
                : "min-w-[60px] lg:min-w-[80px]"
            }`}
          >
            {match.status === "completed" ? (
              <div className="flex items-center gap-1 lg:gap-2">
                <span className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {match.home_score !== undefined ? match.home_score : "-"}
                </span>
                <span className="text-gray-400 text-sm lg:text-base">:</span>
                <span className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {match.away_score !== undefined ? match.away_score : "-"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 lg:gap-2">
                <span className="text-lg lg:text-2xl font-bold text-gray-400">
                  -:-
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MatchRow;

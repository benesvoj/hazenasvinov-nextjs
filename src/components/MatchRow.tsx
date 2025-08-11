import React from "react";
import Link from "@/components/Link";
import { MapPinIcon } from "@heroicons/react/24/outline";

// Helper function to format time from HH:MM:SS to HH:MM
function formatTime(time: string): string {
  if (!time) return "";
  // If time is already in HH:MM format, return as is
  if (time.match(/^\d{2}:\d{2}$/)) return time;
  // If time is in HH:MM:SS format, extract HH:MM
  if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
    return time.substring(0, 5);
  }
  return time;
}

interface Match {
  id: string;
  date: string;
  time: string;
  home_team: string;
  away_team: string;
  home_team_logo?: string;
  away_team_logo?: string;
  venue: string;
  competition: string;
  category?: { name: string; description?: string };
  is_home: boolean;
  status: 'upcoming' | 'completed';
  home_score?: number;
  away_score?: number;
  result?: 'win' | 'loss' | 'draw';
  matchweek?: number;
}

interface MatchRowProps {
  match: Match;
  compact?: boolean;
}

export const MatchRow: React.FC<MatchRowProps> = ({ 
  match, 
  compact = true 
}) => {
  return (
    <Link href={`/matches/${match.id}`} className="block">
      <div className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
        <div className="flex items-center justify-between">
        {/* Date and Time - Left Side */}
        <div className={`flex flex-col items-start ${compact ? 'min-w-[60px]' : 'min-w-[120px]'}`}>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(match.date).toLocaleDateString('cs-CZ', { 
              weekday: 'long'
            })}
          </div>
          <div className="font-semibold text-gray-900 dark:text-white">
            {new Date(match.date).toLocaleDateString('cs-CZ', { 
              day: 'numeric',
              month: 'numeric'
            })}
          </div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {formatTime(match.time)}
          </div>
        </div>

        {/* Teams and Info - Center */}
        <div className="flex-1 flex flex-col items-start mx-4">
          {/* Teams Row */}
          <div className="flex items-center gap-4 mb-2">
            {/* Home Team */}
            <div className="flex items-center gap-3">
              {match.home_team_logo && (
                <img 
                  src={match.home_team_logo} 
                  alt={`${match.home_team} logo`}
                  className="w-8 h-8 object-contain rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <span className={`font-medium text-sm ${match.is_home ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                {match.home_team}
              </span>
            </div>
            
            <span className="text-gray-400 text-sm">x</span>
            
            {/* Away Team */}
            <div className="flex items-center gap-3">
              <span className={`font-medium text-sm ${!match.is_home ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                {match.away_team}
              </span>
              {match.away_team_logo && (
                <img 
                  src={match.away_team_logo} 
                  alt={`${match.away_team} logo`}
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
              {match.category?.description || match.category?.name || match.competition} <MapPinIcon className="w-3 h-3 inline ml-2" /> {match.venue}
              </div>        
            </div>
        </div>

                  {/* Score - Right Side */}
          <div className={`flex flex-col items-end ${compact ? 'min-w-[80px]' : 'min-w-[100px]'}`}>
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
      </div>
    </Link>
  );
};
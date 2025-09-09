import React from "react";
import Image from 'next/image';

interface TeamDisplayProps {
  team: {
    name: string;
    short_name?: string;
    logo_url?: string;
    is_own_club?: boolean;
  };
  isHomeTeam?: boolean;
  showOwnClubBadge?: boolean;
}

export default function TeamDisplay({ team }: TeamDisplayProps) {
  return (
    <div className="flex flex-col items-center space-y-2 sm:space-y-3">
      {/* Desktop Layout - with logo */}
      <div className="hidden sm:block">
        {team.logo_url && (
          <Image 
            src={team.logo_url} 
            alt={`${team.name} logo`}
            width={80}
            height={80}
            className="w-20 h-20 object-contain rounded-full"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
      </div>
      
      {/* Mobile Layout - without logo, with short name */}
      <div className="block sm:hidden">
        <div className="text-center">
          <h2 className={`text-lg font-bold ${team.is_own_club ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
            {team.short_name}
          </h2>
        </div>
      </div>
      
      {/* Desktop Layout - full name */}
      <div className="hidden sm:block text-center">
        <h2 className={`text-xl font-bold ${team.is_own_club ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
          {team.name}
        </h2>
      </div>
    </div>
  );
}

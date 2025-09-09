'use client';

import React, { useState } from "react";
import Image from 'next/image';

interface Team {
  id: string;
  name: string;
  logo_url?: string;
  is_own_club?: boolean;
}

interface TeamDisplayMobileProps {
  team: Team | null;
  fallbackName: string;
  isHomeTeam?: boolean;
}

export default function TeamDisplayMobile({ team, fallbackName, isHomeTeam = false }: TeamDisplayMobileProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="flex items-center gap-3">
      {isHomeTeam ? (
        // Home team: logo first, then name
        <>
          {team?.logo_url && !imageError && (
            <Image 
              src={team.logo_url} 
              alt={`${team?.name || fallbackName} logo`}
              width={32}
              height={32}
              className="w-8 h-8 object-contain rounded-full"
              onError={handleImageError}
            />
          )}
          <span className={`font-medium ${team?.is_own_club ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
            {team?.name || fallbackName}
          </span>
        </>
      ) : (
        // Away team: name first, then logo
        <>
          <span className={`font-medium ${team?.is_own_club ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
            {team?.name || fallbackName}
          </span>
          {team?.logo_url && !imageError && (
            <Image 
              src={team.logo_url} 
              alt={`${team?.name || fallbackName} logo`}
              width={32}
              height={32}
              className="w-8 h-8 object-contain rounded-full"
              onError={handleImageError}
            />
          )}
        </>
      )}
    </div>
  );
}

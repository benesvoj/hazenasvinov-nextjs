'use client';

import React, { useState } from "react";
import Image from 'next/image';

interface Team {
  id: string;
  name: string;
  logo_url?: string;
  is_own_club?: boolean;
}

interface TeamDisplayProps {
  team: Team | null;
  fallbackName: string;
}

export default function TeamDisplay({ team, fallbackName }: TeamDisplayProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="flex items-center gap-2">
      {team?.logo_url && !imageError && (
        <Image 
          src={team.logo_url} 
          alt={`${team?.name || fallbackName} logo`}
          width={20}
          height={20}
          className="w-5 h-5 object-contain rounded-full flex-shrink-0"
          onError={handleImageError}
        />
      )}
      <span className={`text-sm font-medium truncate ${team?.is_own_club ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
        {team?.name || fallbackName}
      </span>
    </div>
  );
}

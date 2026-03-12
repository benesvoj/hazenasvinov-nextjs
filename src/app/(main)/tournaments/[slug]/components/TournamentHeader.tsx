'use client';

import {Badge} from '@heroui/badge';

import {Heading, HStack} from '@/components';
import {formatDateString} from '@/helpers';

interface TournamentHeaderProps {
  tournament: {
    name: string;
    start_date: string;
    end_date?: string | null;
    venue?: string | null;
    description?: string | null;
    category?: {name: string} | null;
  };
}

export function TournamentHeader({tournament}: TournamentHeaderProps) {
  return (
    <div className="space-y-2">
      <Heading size={1}>{tournament.name}</Heading>
      <HStack spacing={4} wrap>
        {tournament.category?.name && <Badge>{tournament.category.name}</Badge>}
        <span>{formatDateString(tournament.start_date)}</span>
        {tournament.end_date && <span>– {formatDateString(tournament.end_date)}</span>}
        {tournament.venue && <span>{tournament.venue}</span>}
      </HStack>
      {tournament.description && <p className="text-gray-600 mt-4">{tournament.description}</p>}
    </div>
  );
}

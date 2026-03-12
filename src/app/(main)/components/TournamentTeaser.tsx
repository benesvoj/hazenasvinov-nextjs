'use client';

import {useEffect, useState} from 'react';

import Link from 'next/link';

import {CalendarIcon, MapPinIcon, TrophyIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {supabaseBrowserClient} from '@/utils/supabase/client';

import {ContentCard, Heading, HStack, VStack} from '@/components';
import {formatDateString} from '@/helpers';

const t = translations.tournaments.public;

interface TournamentTeaserData {
  id: string;
  name: string;
  slug: string;
  start_date: string;
  end_date: string | null;
  venue: string | null;
  category: {name: string} | null;
}

export function TournamentTeaser() {
  const [tournaments, setTournaments] = useState<TournamentTeaserData[]>([]);

  useEffect(() => {
    const fetchTournaments = async () => {
      const supabase = supabaseBrowserClient();
      const {data} = await supabase
        .from('tournaments')
        .select('id, name, slug, start_date, end_date, venue, category:categories(name)')
        .eq('status', 'published')
        .order('start_date', {ascending: false})
        .limit(3);

      if (data) setTournaments(data);
    };
    void fetchTournaments();
  }, []);

  if (tournaments.length === 0) return null;
  console.log('Fetched tournaments for teaser:', tournaments);

  const title = (
    <HStack spacing={2}>
      <TrophyIcon className="w-5 h-5 text-yellow-600" />
      <span>{t.teaser}</span>
    </HStack>
  );

  return (
    <ContentCard title={title}>
      <VStack spacing={4}>
        {tournaments.map((tournament) => (
          <Link
            key={tournament.id}
            href={`/tournaments/${tournament.slug}`}
            className="block p-4 rounded-lg border hover:bg-gray-50 transition"
          >
            <Heading size={4}>{tournament.name}</Heading>
            <HStack spacing={4} className="mt-2 text-sm text-gray-500">
              {tournament.category && <span>{tournament.category.name}</span>}
              <HStack spacing={1}>
                <CalendarIcon className="w-4 h-4" />
                <span>{formatDateString(tournament.start_date)}</span>
              </HStack>
              {tournament.venue && (
                <HStack spacing={1}>
                  <MapPinIcon className="w-4 h-4" />
                  <span>{tournament.venue}</span>
                </HStack>
              )}
            </HStack>
          </Link>
        ))}
      </VStack>
    </ContentCard>
  );
}

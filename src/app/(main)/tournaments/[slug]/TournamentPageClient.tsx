'use client';

import {useQuery} from '@tanstack/react-query';

import {fetchTournamentPageData} from '@/queries/tournaments';
import {EnhancedStanding} from '@/types';

import {
  TournamentBlogLink,
  TournamentHeader,
  TournamentSchedule,
  TournamentStandings,
} from './components';

interface TournamentPageClientProps {
  slug: string;
}

export default function TournamentPageClient({slug}: TournamentPageClientProps) {
  const {data} = useQuery({
    queryKey: ['tournament', slug],
    queryFn: () => fetchTournamentPageData(slug),
  });

  if (!data) return null;

  const {tournament, matches, standings} = data;

  // Transform standings to EnhancedStanding for UnifiedStandingTable
  const enhancedStandings: EnhancedStanding[] = (standings || []).map((row: any) => {
    const team = row.team;
    const club = team?.club_category?.club;

    return {
      ...row,
      category_id: '',
      season_id: '',
      team: team
        ? {
            id: team.id,
            team_suffix: team.team_suffix || 'A',
            club_name: club?.name || 'Neznámý klub',
            club_id: club?.id || null,
            logo_url: club?.logo_url || undefined,
          }
        : null,
      club: club
        ? {
            id: club.id,
            name: club.name,
            short_name: club.short_name,
            logo_url: club.logo_url,
          }
        : null,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div className="grid grid-cols-1 gap-8">
        <div className="order-1">
          <TournamentHeader tournament={tournament} />
        </div>

        <div className="order-2 md:order-3">
          <TournamentStandings standings={enhancedStandings} />
        </div>

        <div className="order-3 md:order-2">
          <TournamentSchedule matches={matches || []} />
        </div>

        {tournament.post_id && (
          <div className="order-4">
            <TournamentBlogLink postId={tournament.post_id} slug={tournament.slug} />
          </div>
        )}
      </div>
    </div>
  );
}

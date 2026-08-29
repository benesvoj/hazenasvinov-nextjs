'use client';

import {useState} from 'react';

import {useParams} from 'next/navigation';

import {translations} from '@/lib/translations';

import {
  MetadataTab,
  PublicationTab,
  ScheduleTab,
  StandingsTab,
  TeamsTab,
} from '@/app/admin/tournaments/[id]/components';

import {AdminContainer} from '@/components';
import {useFetchTournament} from '@/hooks';
import {Tournament} from '@/types';

const TABS = [
  {key: 'metadata', title: translations.tournaments.tabs.metadata},
  {key: 'teams', title: translations.tournaments.tabs.teams},
  {key: 'schedule', title: translations.tournaments.tabs.schedule},
  {key: 'standings', title: translations.tournaments.tabs.standings},
  {key: 'publication', title: translations.tournaments.tabs.publication},
];

export default function TournamentDetailPage() {
  const {id} = useParams<{id: string}>();
  const [activeTab, setActiveTab] = useState('metadata');

  const {data: tournament, loading, refetch} = useFetchTournament(id);

  const tabs =
    tournament &&
    TABS.map((tab) => ({
      ...tab,
      content: renderTabContent(tab.key, id, tournament, loading, refetch),
    }));

  const pageTitle = tournament?.name || translations.tournaments.page.title;
  const pageDescription = tournament?.description || undefined;

  return (
    <AdminContainer
      title={pageTitle}
      description={pageDescription}
      tabs={tabs || []}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isLoading={loading}
    />
  );
}

function renderTabContent(
  tabKey: string,
  tournamentId: string,
  tournament: Tournament,
  loading: boolean,
  refetch: () => void
) {
  switch (tabKey) {
    case 'metadata':
      return (
        <MetadataTab
          tournamentId={tournamentId}
          tournament={tournament}
          loading={loading}
          refetch={refetch}
        />
      );
    case 'teams':
      return <TeamsTab tournamentId={tournamentId} tournament={tournament} />;
    case 'schedule':
      return <ScheduleTab tournamentId={tournamentId} tournament={tournament} />;
    case 'standings':
      return <StandingsTab tournamentId={tournamentId} />;
    case 'publication':
      return (
        <PublicationTab tournamentId={tournamentId} tournament={tournament} refetch={refetch} />
      );
  }
}

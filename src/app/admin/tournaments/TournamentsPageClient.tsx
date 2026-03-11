'use client';

import {useRouter} from 'next/navigation';

import {APP_ROUTES} from '@/lib/app-routes';
import {translations} from '@/lib/translations';

import {AdminContainer, UnifiedTable} from '@/components';
import {ActionTypes} from '@/enums';
import {
  useFetchCategories,
  useFetchSeasons,
  useFetchTournaments,
  useModalWithItem,
  useTournaments,
} from '@/hooks';
import {TrophyIcon} from '@/lib';
import {Tournament} from '@/types';

import {TournamentFormModal} from './components';

export default function TournamentsPageClient() {
  const router = useRouter();
  const {data: categories} = useFetchCategories();
  const {data: seasons} = useFetchSeasons();
  const {data: tournaments, loading, refetch} = useFetchTournaments();
  const {createTournament, deleteTournament} = useTournaments();
  const modal = useModalWithItem<Tournament>();

  const actions = [
    {
      label: translations.tournaments.addTournament,
      onClick: () => modal.onOpen(),
      buttonType: ActionTypes.CREATE,
      priority: 'primary' as const,
    },
  ];

  const columns = [
    {key: 'name', label: translations.tournaments.table.name},
    {key: 'category', label: translations.tournaments.table.category},
    {key: 'date', label: translations.tournaments.table.date},
    {key: 'status', label: translations.tournaments.table.status},
    {key: 'actions', label: translations.tournaments.table.actions},
  ];

  const renderCell = (tournament: Tournament, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return tournament.name;
      case 'category':
        return tournament.category_id;
      case 'date':
        return new Date(tournament.start_date).toLocaleDateString();
      case 'status':
        return tournament.status;
      case 'actions':
        return (
          <div>
            <button onClick={() => router.push(APP_ROUTES.admin.tournamentDetail(tournament.id))}>
              {translations.common.actions.read}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const handleCreateTournament = async (data: any) => {
    await createTournament(data);
    modal.onClose();
    await refetch();
  };

  return (
    <AdminContainer actions={actions} icon={<TrophyIcon className={'w-6 h-6'} />} loading={loading}>
      <UnifiedTable
        columns={columns}
        renderCell={renderCell}
        data={tournaments}
        ariaLabel={translations.tournaments.table.ariaLabel}
        onRowAction={(id) => router.push(APP_ROUTES.admin.tournamentDetail(id as string))}
      />

      <TournamentFormModal
        isOpen={modal.isOpen}
        onClose={modal.closeAndClear}
        onSuccess={handleCreateTournament}
        categories={categories}
        seasons={seasons}
        tournament={modal.selectedItem}
      />
    </AdminContainer>
  );
}

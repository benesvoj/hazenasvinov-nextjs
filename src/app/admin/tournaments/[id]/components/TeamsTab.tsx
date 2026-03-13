// TODO: edit seed order (drag and drop or input)

'use client';

import {Alert} from '@heroui/alert';
import {Button} from '@heroui/button';

import {translations} from '@/lib/translations';

import {TeamPickerModal} from '@/app/admin/tournaments/[id]/components/TeamPickerModal';

import {ContentCard, DeleteDialog, HStack, UnifiedTable, VStack} from '@/components';
import {
  useFetchTournamentTeams,
  useFilteredTeams,
  useModal,
  useModalWithItem,
  useTournamentTeams,
} from '@/hooks';
import {PlusIcon, TrashIcon} from '@/lib';
import {Tournament, TournamentTeamQuery} from '@/types';
import {getCount} from '@/utils';

interface TeamsTabProps {
  tournamentId: string;
  tournament: Tournament;
}

export const TeamsTab = ({tournamentId, tournament}: TeamsTabProps) => {
  const {data: enrolledTeams, loading, refetch} = useFetchTournamentTeams(tournamentId);
  const {teams: availableTeams} = useFilteredTeams({
    categoryId: tournament.category_id || undefined,
    seasonId: tournament.season_id || undefined,
  });

  const {addTeam, removeTeam, loading: CRUDLoading} = useTournamentTeams(tournamentId);

  const enrolledTeamIds = new Set(enrolledTeams.map((t) => t.team_id));
  const pickableTeams = availableTeams.filter((t) => !enrolledTeamIds.has(t.id));

  const modal = useModal();
  const deleteDialog = useModalWithItem<{teamId: string}>();

  const columns = [
    {key: 'seedOrder', label: '#'},
    {key: 'team', label: translations.tournaments.labels.teams},
    {key: 'actions', label: translations.tournaments.table.actions},
  ];

  const actions = (
    <Button size={'sm'} color={'primary'} startContent={<PlusIcon />} onPress={modal.onOpen}>
      {translations.tournaments.actions.addTeam}
    </Button>
  );

  const nextSeedOrder = getCount(enrolledTeams) + 1;

  const renderTeamCell = (team: TournamentTeamQuery, columnKey: string) => {
    const club = team.team?.club_category?.club;

    if (columnKey === 'seedOrder') {
      return team.seed_order;
    }
    if (columnKey === 'team') {
      return `${club?.name || ''} ${team.team?.team_suffix || ''}`.trim();
    }
    if (columnKey === 'actions') {
      return (
        <HStack spacing={2}>
          <Button
            isIconOnly
            size={'sm'}
            variant={'light'}
            color={'danger'}
            aria-label={translations.tournaments.actions.removeTeam}
            onPress={() => deleteDialog.openWith({teamId: team.team_id})}
          >
            <TrashIcon className="w-6 h-6" />
          </Button>
        </HStack>
      );
    }
    return null;
  };

  const handleAddTeam = async (teamId: string) => {
    if (!teamId) return;

    try {
      await addTeam(teamId, nextSeedOrder);
      await refetch();
    } catch (err: any) {
      console.error('Error adding team to tournament:', err);
    } finally {
      modal.onClose();
    }
  };

  const handleDeleteTeam = async () => {
    const teamId = deleteDialog.selectedItem?.teamId;
    if (!teamId) return;

    await removeTeam(teamId);
    await refetch();
    deleteDialog.closeAndClear();
  };

  return (
    <>
      <ContentCard
        title={translations.tournaments.labels.teams}
        actions={actions}
        isLoading={loading}
      >
        <VStack spacing={4}>
          <UnifiedTable
            columns={columns}
            data={enrolledTeams}
            renderCell={renderTeamCell}
            ariaLabel={translations.tournaments.table.ariaLabel}
            isLoading={loading}
          />
          {getCount(enrolledTeams) < 3 && (
            <Alert color={'warning'}>{translations.tournaments.validation.minTeams}</Alert>
          )}
        </VStack>
      </ContentCard>

      <TeamPickerModal
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        teams={pickableTeams}
        onSave={handleAddTeam}
      />

      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.closeAndClear}
        onSubmit={handleDeleteTeam}
        title={translations.tournaments.modal.removeTeamTitle}
        message={translations.tournaments.modal.removeTeamMessage}
        isLoading={CRUDLoading}
      />
    </>
  );
};

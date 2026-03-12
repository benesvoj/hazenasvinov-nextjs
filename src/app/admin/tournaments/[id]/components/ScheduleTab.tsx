'use client';

import {useMemo} from 'react';

import {Button} from '@heroui/button';

import {translations} from '@/lib/translations';

import {MatchResultModal} from '@/app/admin/tournaments/[id]/components/MatchResultModal';

import {ContentCard, DeleteDialog, EmptyState, HStack, VStack} from '@/components';
import {
  useFetchTournamentMatches,
  useFetchTournamentTeams,
  useMatchMutations,
  useModal,
  useModalWithItem,
  useScheduleGeneration,
} from '@/hooks';
import {EditIcon} from '@/lib';
import {Tournament, TournamentMatch} from '@/types';

const t = translations.tournaments;

function getTeamName(team: TournamentMatch['home_team']): string {
  const club = team.club_category?.club;
  return `${club?.short_name || club?.name || ''} ${team.team_suffix || ''}`.trim();
}

function formatScore(match: TournamentMatch): string {
  if (match.home_score === null || match.away_score === null) return '— : —';
  return `${match.home_score} : ${match.away_score}`;
}

function formatHalftime(match: TournamentMatch): string | null {
  if (match.home_score_halftime === null || match.away_score_halftime === null) return null;
  return `(${match.home_score_halftime}:${match.away_score_halftime})`;
}

interface ScheduleTabProps {
  tournamentId: string;
  tournament: Tournament;
}

export const ScheduleTab = ({tournamentId, tournament}: ScheduleTabProps) => {
  const {data: matches, loading, refetch} = useFetchTournamentMatches(tournamentId);
  const {data: teams} = useFetchTournamentTeams(tournamentId);
  const {generateSchedule, loading: generatingSchedule} = useScheduleGeneration();
  const {updateMatchResult, loading: savingResult} = useMatchMutations({
    selectedCategory: tournament.category_id || '',
    selectedSeason: tournament.season_id || '',
    tournamentId,
  });

  const matchModal = useModalWithItem<TournamentMatch>();
  const regenerateDialog = useModal();

  const hasEnoughTeams = teams.length >= 3;
  const hasMatches = matches.length > 0;

  const matchesByRound = useMemo(() => {
    const grouped = new Map<number, TournamentMatch[]>();
    for (const match of matches) {
      const round = match.round ?? 0;
      if (!grouped.has(round)) grouped.set(round, []);
      grouped.get(round)!.push(match);
    }
    return grouped;
  }, [matches]);

  const handleGenerate = async () => {
    const success = await generateSchedule(tournamentId);
    if (success) await refetch();
  };

  const handleRegenerate = async () => {
    const success = await generateSchedule(tournamentId);
    if (success) await refetch();
    regenerateDialog.onClose();
  };

  const handleSaveResult = async (
    matchId: string,
    data: {
      home_score: number;
      away_score: number;
      home_score_halftime: number;
      away_score_halftime: number;
    }
  ) => {
    const success = await updateMatchResult(matchId, data);
    if (success) await refetch();
    return success;
  };

  if (!hasMatches && !loading) {
    return (
      <ContentCard>
        <EmptyState
          type="matches"
          title={t.labels.schedule}
          description={t.descriptions.scheduleEmpty}
          action={
            hasEnoughTeams ? (
              <Button color="primary" onPress={handleGenerate} isLoading={generatingSchedule}>
                {t.actions.generateSchedule}
              </Button>
            ) : undefined
          }
        />
      </ContentCard>
    );
  }

  const headerActions = (
    <Button
      size="sm"
      color="warning"
      variant="flat"
      onPress={regenerateDialog.onOpen}
      isLoading={generatingSchedule}
    >
      {t.actions.regenerateSchedule}
    </Button>
  );

  return (
    <>
      <ContentCard title={t.labels.schedule} actions={headerActions} isLoading={loading}>
        <VStack spacing={6} align="stretch">
          {Array.from(matchesByRound.entries()).map(([round, roundMatches]) => (
            <div key={round}>
              <h3 className="text-sm font-semibold mb-3">
                {t.labels.round} {round}
              </h3>
              <VStack spacing={2} align="stretch">
                {roundMatches.map((match) => {
                  const halftime = formatHalftime(match);
                  return (
                    <div
                      key={match.id}
                      className="flex items-center justify-between rounded-lg border border-default-200 px-4 py-2"
                    >
                      <HStack spacing={3} align="center">
                        <span className="text-sm min-w-[120px] text-right">
                          {getTeamName(match.home_team)}
                        </span>
                        <span className="text-sm font-bold min-w-[60px] text-center">
                          {formatScore(match)}
                        </span>
                        <span className="text-sm min-w-[120px]">
                          {getTeamName(match.away_team)}
                        </span>
                        {halftime && <span className="text-xs text-default-400">{halftime}</span>}
                      </HStack>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        aria-label={t.modal.resultTitle}
                        onPress={() => matchModal.openWith(match)}
                      >
                        <EditIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </VStack>
            </div>
          ))}
        </VStack>
      </ContentCard>

      <MatchResultModal
        isOpen={matchModal.isOpen}
        onClose={matchModal.closeAndClear}
        match={matchModal.selectedItem}
        onSave={handleSaveResult}
        isLoading={savingResult}
      />

      <DeleteDialog
        isOpen={regenerateDialog.isOpen}
        onClose={regenerateDialog.onClose}
        onSubmit={handleRegenerate}
        title={t.modal.regenerateTitle}
        message={t.modal.regenerateMessage}
        isLoading={generatingSchedule}
      />
    </>
  );
};

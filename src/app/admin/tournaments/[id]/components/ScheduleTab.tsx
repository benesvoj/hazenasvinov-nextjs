'use client';

import {useMemo} from 'react';

import {Button} from '@heroui/button';

import {ClockIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {ContentCard, DeleteDialog, EmptyState, Heading, HStack, VStack} from '@/components';
import {formatHalftime, formatScore, formatTime, getTeamName} from '@/helpers';
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
import {isNotNilOrEmpty} from '@/utils';

import {MatchResultModal, MatchTimePickerModal} from './';

const t = translations.tournaments;

interface ScheduleTabProps {
  tournamentId: string;
  tournament: Tournament;
}

export const ScheduleTab = ({tournamentId, tournament}: ScheduleTabProps) => {
  const {data: matches, loading, refetch} = useFetchTournamentMatches(tournamentId);
  const {data: teams} = useFetchTournamentTeams(tournamentId);
  const {generateSchedule, loading: generatingSchedule} = useScheduleGeneration();
  const {
    updateMatchResult,
    updateMatchTime,
    loading: savingUpdate,
  } = useMatchMutations({
    selectedCategory: tournament.category_id || '',
    selectedSeason: tournament.season_id || '',
    tournamentId,
  });

  const matchModal = useModalWithItem<TournamentMatch>();
  const matchTimeModal = useModalWithItem<TournamentMatch>();
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

  const handleSaveMatchTime = async (
    matchId: string,
    data: {
      time: string;
    }
  ) => {
    const success = await updateMatchTime(matchId, data);
    if (success) await refetch();
    return success;
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

  const emptyState = (
    <EmptyState
      type="matches"
      title={t.labels.schedule}
      description={t.descriptions.scheduleEmpty}
      action={
        <Button color="primary" onPress={handleGenerate} isLoading={generatingSchedule}>
          {t.actions.generateSchedule}
        </Button>
      }
    />
  );

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
      <ContentCard
        title={t.labels.schedule}
        actions={headerActions}
        isLoading={loading}
        emptyState={!loading && !hasMatches && emptyState}
      >
        <VStack spacing={6} align="stretch">
          {Array.from(matchesByRound.entries()).map(([round, roundMatches]) => (
            <div key={round}>
              <Heading size={3}>
                {t.labels.round} {round}
              </Heading>
              <VStack spacing={2} align="stretch">
                {roundMatches.map((match) => {
                  const halftime = formatHalftime(match);
                  return (
                    <HStack
                      key={match.id}
                      className="rounded-lg border border-default-200 px-4 py-2"
                      justify={'between'}
                    >
                      <HStack spacing={2}>
                        <HStack>
                          {isNotNilOrEmpty(match.time) && match.time !== '00:00:00' && (
                            <span className="text-sm min-w-[100px] text-right">
                              {formatTime(match.time)}
                            </span>
                          )}
                        </HStack>
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
                      </HStack>
                      <HStack justify={'end'}>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          aria-label={t.modal.scheduleTitle}
                          onPress={() => matchTimeModal.openWith(match)}
                        >
                          <ClockIcon className={'w-4 h-4'} />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          aria-label={t.modal.resultTitle}
                          onPress={() => matchModal.openWith(match)}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                      </HStack>
                    </HStack>
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
        isLoading={savingUpdate}
      />

      <MatchTimePickerModal
        isOpen={matchTimeModal.isOpen}
        onClose={matchTimeModal.closeAndClear}
        match={matchTimeModal.selectedItem}
        onSave={handleSaveMatchTime}
        isLoading={savingUpdate}
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

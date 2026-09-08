'use client';

import React, {useState} from 'react';

import {Button, Chip} from '@heroui/react';

import {ArrowPathIcon, PlusIcon, UserGroupIcon} from '@heroicons/react/24/outline';

import {getLineupCoachRoleOptions} from '@/enums/getLineupCoachRoleOptions';

import type {MatchLineupPlayer} from '@/hooks/entities/lineup/useFetchMatchLineup';
import {useGenerateMatchLineup} from '@/hooks/entities/lineup/useGenerateMatchLineup';

import {BallIcon, RedCardIcon, YellowCardIcon} from '@/lib/icons';
import {translations} from '@/lib/translations';

import {Dialog, LoadingSpinner, VStack} from '@/components';
import {useAppData} from '@/contexts';
import {PlayerPosition, TeamTypes} from '@/enums';
import {LineupManagerModal} from '@/features/lineupManager';
import {useFetchMatchLineup, useModal} from '@/hooks';
import {CategoryLineup, Match} from '@/types';
import {hasItems, hasMoreThanOne} from '@/utils';

const t = translations.matches.lineupGeneration;

/** Trest 5 min, 10 min i osobní se v přehledu zobrazují jako jedna červená. */
const totalRedCards = (player: MatchLineupPlayer) =>
  (player.red_cards_5min ?? 0) + (player.red_cards_10min ?? 0) + (player.red_cards_personal ?? 0);

interface MatchLineupPanelProps {
  selectedMatch: Match;
}

/**
 * Our club's lineup for one match, with the ways of filling it in.
 *
 * Shared by the played-match detail and the preparation panel of an upcoming
 * one. Those two used to differ only in that the upcoming one had no lineup
 * section at all, so a coach could not put a squad together until after the
 * match had been played — which is the wrong way round.
 *
 * Data comes from `lineups` / `lineup_players`, written by LineupManager, which
 * opens here locked to our own team so the opponent's sheet cannot be
 * overwritten.
 */
export const MatchLineupPanel = ({selectedMatch}: MatchLineupPanelProps) => {
  const [isLineupManagerOpen, setIsLineupManagerOpen] = useState(false);
  const pickLineupModal = useModal();

  const {
    members: {data: members},
  } = useAppData();

  // Který tým je náš klub. Zápas cizích týmů se sem přes soupis trenéra
  // nedostane, ale flagy jsou na Match volitelné, tak se s tím počítá.
  const ownTeamType = selectedMatch.home_team_is_own_club
    ? TeamTypes.HOME
    : selectedMatch.away_team_is_own_club
      ? TeamTypes.AWAY
      : null;
  const ownTeamId =
    ownTeamType === TeamTypes.HOME
      ? selectedMatch.home_team_id
      : ownTeamType === TeamTypes.AWAY
        ? selectedMatch.away_team_id
        : undefined;
  const ownTeamName =
    (ownTeamType === TeamTypes.HOME
      ? selectedMatch.home_team?.name
      : selectedMatch.away_team?.name) || 'Náš tým';

  const {
    lineup: ownTeamLineup,
    isLoading: lineupLoading,
    error: lineupError,
    invalidateLineup,
  } = useFetchMatchLineup(selectedMatch.id, ownTeamId);

  const {selectableLineups, generating, generate} = useGenerateMatchLineup({
    match: selectedMatch,
    ownTeamId,
    isHomeTeam: ownTeamType === TeamTypes.HOME,
  });

  /**
   * The button is the offer to fill an empty sheet, so it goes as soon as there
   * is anything on it — including a lineup that holds only coaches, where
   * generating would drop them along with the rest.
   */
  const isLineupEmpty = !hasItems(ownTeamLineup.players) && !hasItems(ownTeamLineup.coaches);
  const canGenerate =
    Boolean(ownTeamType) && isLineupEmpty && !lineupLoading && hasItems(selectableLineups);

  const runGeneration = async (categoryLineupId: string) => {
    await generate(categoryLineupId);
    invalidateLineup();
  };

  /** One squad needs no question asked; several do. */
  const handleGenerate = async () => {
    if (hasMoreThanOne(selectableLineups)) {
      pickLineupModal.onOpen();
      return;
    }
    await runGeneration(selectableLineups[0].id);
  };

  const handlePick = async (categoryLineupId: string) => {
    pickLineupModal.onClose();
    await runGeneration(categoryLineupId);
  };

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-base">
              Sestava
              {ownTeamLineup.players.length > 0 && (
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({ownTeamLineup.players.length})
                </span>
              )}
            </h4>
          </div>
          <div className="flex items-center gap-1">
            {canGenerate && (
              <Button
                size="sm"
                variant="light"
                color="primary"
                onPress={handleGenerate}
                isLoading={generating}
                startContent={!generating && <ArrowPathIcon className="w-4 h-4" />}
                className="text-xs"
              >
                {t.action}
              </Button>
            )}
            {ownTeamType && (
              <Button
                size="sm"
                variant="light"
                onPress={() => setIsLineupManagerOpen(true)}
                startContent={<PlusIcon className="w-4 h-4" />}
                className="text-xs"
              >
                Upravit sestavu
              </Button>
            )}
          </div>
        </div>

        {!ownTeamType ? (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-xs text-gray-500 dark:text-gray-400">
            Ani jeden tým tohoto zápasu není náš klub, sestavu tu zapsat nelze.
          </div>
        ) : lineupLoading ? (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex items-center justify-center h-32">
            <LoadingSpinner />
          </div>
        ) : lineupError ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-center justify-center h-32 border border-red-200 dark:border-red-800">
            <div className="text-center text-red-600 dark:text-red-400">
              <UserGroupIcon className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Chyba při načítání sestavy</p>
              <p className="text-xs mt-1">Zkuste to prosím znovu</p>
            </div>
          </div>
        ) : isLineupEmpty ? (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sestava zatím není zapsaná. Přidejte hráče ze soupisky a zaznamenejte jim góly a
              karty.
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
            <h5 className="font-medium text-sm text-gray-600 dark:text-gray-400">{ownTeamName}</h5>

            {ownTeamLineup.players.length > 0 && (
              <div className="space-y-2">
                {ownTeamLineup.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between gap-3 p-2 bg-white dark:bg-gray-700 rounded"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 shrink-0 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full flex items-center justify-center text-xs font-semibold">
                        {player.jersey_number ?? '-'}
                      </span>
                      <span className="text-sm truncate">
                        {player.member
                          ? `${player.member.surname} ${player.member.name}`
                          : 'Neznámý hráč'}
                      </span>
                      {player.position === PlayerPosition.GOALKEEPER && (
                        <Chip size="sm" variant="flat" color="success">
                          B
                        </Chip>
                      )}
                      {player.is_captain && (
                        <Chip size="sm" variant="flat" color="secondary">
                          C
                        </Chip>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-xs">
                      {!!player.goals && (
                        <span className="flex items-center gap-1" title="Góly">
                          <BallIcon />
                          {player.goals}
                        </span>
                      )}
                      {!!player.yellow_cards && (
                        <span className="flex items-center gap-1" title="Žluté karty">
                          <YellowCardIcon />
                          {player.yellow_cards}
                        </span>
                      )}
                      {!!totalRedCards(player) && (
                        <span className="flex items-center gap-1" title="Červené karty">
                          <RedCardIcon />
                          {totalRedCards(player)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {ownTeamLineup.coaches.length > 0 && (
              <div className="space-y-2">
                <h6 className="text-xs text-gray-500 dark:text-gray-400">Trenéři</h6>
                {ownTeamLineup.coaches.map((coach) => (
                  <div
                    key={coach.id}
                    className="flex items-center justify-between gap-3 p-2 bg-white dark:bg-gray-700 rounded"
                  >
                    <span className="text-sm truncate">
                      {coach.member
                        ? `${coach.member.surname} ${coach.member.name}`
                        : 'Neznámý trenér'}
                    </span>
                    <Chip size="sm" variant="flat" color="secondary">
                      {getLineupCoachRoleOptions().find((role) => role.value === coach.role)
                        ?.label ?? coach.role}
                    </Chip>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog
        isOpen={pickLineupModal.isOpen}
        onClose={pickLineupModal.onClose}
        title={t.dialogTitle}
        size="md"
      >
        <VStack spacing={2} align="stretch">
          <p className="text-sm text-gray-500">{t.dialogMessage}</p>
          {selectableLineups.map((lineup: CategoryLineup) => (
            <Button
              key={lineup.id}
              variant="flat"
              className="justify-start"
              isDisabled={generating}
              onPress={() => handlePick(lineup.id)}
            >
              <span className="truncate">
                {lineup.name}
                {lineup.description && (
                  <span className="ml-2 text-xs text-gray-500">{lineup.description}</span>
                )}
              </span>
            </Button>
          ))}
        </VStack>
      </Dialog>

      {ownTeamType && (
        <LineupManagerModal
          isOpen={isLineupManagerOpen}
          onClose={() => setIsLineupManagerOpen(false)}
          selectedMatch={selectedMatch}
          members={members}
          lockedTeam={ownTeamType}
        />
      )}
    </>
  );
};

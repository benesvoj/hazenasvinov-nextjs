'use client';

import {useCallback, useState} from 'react';

import {showToast} from '@/components/ui/feedback';

import {translations} from '@/lib/translations';

import {PlayerPosition} from '@/enums';
import {useFetchCategoryLineups, useLineupData, useSupabaseClient} from '@/hooks';
import {CategoryLineup, LineupPlayerFormData, Match} from '@/types';
import {isEmpty} from '@/utils';

const t = translations.matches.lineupGeneration;

interface UseGenerateMatchLineupParams {
  match: Match;
  /** `club_category_teams.id` of our side of this match. */
  ownTeamId?: string;
  isHomeTeam: boolean;
}

/**
 * Builds a match lineup from the category lineup (soupiska) the coach keeps.
 *
 * The two are separate records on purpose — a match lineup carries goals and
 * cards, a category lineup does not — but typing eighteen names in again for
 * every match is the kind of work nobody does, so match lineups simply stayed
 * empty. This copies the squad across once; from there the coach edits it in
 * the lineup manager.
 *
 * Only offered while the match lineup is empty. Once a single player is on it,
 * regenerating would mean deciding what happens to goals and cards already
 * recorded, and the answer to that is "the coach edits the lineup", not "the
 * button silently rebuilds it".
 */
export function useGenerateMatchLineup({
  match,
  ownTeamId,
  isHomeTeam,
}: UseGenerateMatchLineupParams) {
  const supabase = useSupabaseClient();
  const {saveLineup} = useLineupData();
  const [generating, setGenerating] = useState(false);

  const {data: categoryLineups, loading: lineupsLoading} = useFetchCategoryLineups({
    categoryId: match.category_id ?? '',
    seasonId: match.season_id ?? '',
  });

  /**
   * An inactive category lineup is one the coach has retired; it must not be
   * what a match gets built from. When none is flagged active the whole list
   * stands, so a club that never sets the flag is not locked out.
   */
  const selectableLineups: CategoryLineup[] = categoryLineups.some((lineup) => lineup.is_active)
    ? categoryLineups.filter((lineup) => lineup.is_active)
    : categoryLineups;

  const generate = useCallback(
    async (categoryLineupId: string): Promise<number> => {
      if (!ownTeamId) return 0;

      setGenerating(true);
      try {
        // Deactivated members are joined with `!inner` and filtered out: they
        // are gone from the roster the coach sees, so they must not arrive in a
        // match lineup through the back door.
        const {data, error} = await supabase
          .from('category_lineup_members')
          .select('member_id, position, jersey_number, is_captain, members!inner(is_active)')
          .eq('lineup_id', categoryLineupId)
          .eq('members.is_active', true);

        if (error) throw error;

        const players: LineupPlayerFormData[] = (data ?? []).map((row: any) => ({
          member_id: row.member_id,
          position: row.position || PlayerPosition.FIELD_PLAYER,
          jersey_number: row.jersey_number ?? undefined,
          is_captain: row.is_captain ?? false,
          goals: 0,
          yellow_cards: 0,
          red_cards_5min: 0,
          red_cards_10min: 0,
          red_cards_personal: 0,
        }));

        if (isEmpty(players)) {
          showToast.warning(t.emptyCategoryLineup);
          return 0;
        }

        // skipValidation: a category lineup is a squad, not a matchday sheet.
        // It may hold no goalkeeper or more players than a match allows, and
        // refusing to copy it would leave the coach with nothing to edit. The
        // lineup manager validates on save.
        await saveLineup(
          '',
          {
            match_id: match.id,
            team_id: ownTeamId,
            is_home_team: isHomeTeam,
            players,
            coaches: [],
          },
          true
        );

        showToast.success(t.generated(players.length));
        return players.length;
      } catch (err) {
        showToast.danger(`${t.failed}${err instanceof Error ? `: ${err.message}` : ''}`);
        throw err;
      } finally {
        setGenerating(false);
      }
    },
    [supabase, saveLineup, match.id, ownTeamId, isHomeTeam]
  );

  return {
    /** Category lineups this match could be built from. */
    selectableLineups,
    lineupsLoading,
    generating,
    generate,
    /** Nothing to generate from — the button has no reason to appear. */
    hasNoSource: !lineupsLoading && isEmpty(selectableLineups),
  };
}

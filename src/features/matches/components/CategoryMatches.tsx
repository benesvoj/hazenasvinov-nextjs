import React, {useMemo, useState} from 'react';

import {Button} from '@heroui/react';

import {ChevronDownIcon, ChevronUpIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {isPlayoffPhase, MatchPhase, PLAYOFF_PHASES} from '@/enums';
import {Match, Category} from '@/types';

import {CategoryMatchRow} from './CategoryMatchRow';

interface CategoryMatchesProps {
  matches: Match[];
  category: Category;
  expandedMatchweeks: Set<string>;
  toggleMatchweek: (categoryId: string, matchweek: number) => void;
  isMatchweekExpanded: (categoryId: string, matchweek: number) => boolean;
  onAddResult: (match: Match) => void;
  onEditMatch: (match: Match) => void;
  onLineupModalOpen: (match: Match) => void;
  onDeleteClick: (match: Match) => void;
  onMatchActionsOpen: (match: Match) => void;
  isSeasonClosed: boolean;
  refereesByMatchId?: Map<string, {order: number; name: string; surname: string}[]>;
}

export default function CategoryMatches({
  matches,
  category,
  expandedMatchweeks,
  toggleMatchweek,
  isMatchweekExpanded,
  onAddResult,
  onEditMatch,
  onLineupModalOpen,
  onDeleteClick,
  onMatchActionsOpen,
  isSeasonClosed,
  refereesByMatchId,
}: CategoryMatchesProps) {
  // Playoff matches grouped by phase in declaration order
  const playoffByPhase = useMemo(() => {
    const grouped = new Map<MatchPhase, Match[]>();
    PLAYOFF_PHASES.forEach((phase) => grouped.set(phase, []));
    matches
      .filter((m) => m.category_id === category.id && isPlayoffPhase(m.match_phase))
      .forEach((m) => {
        const phase = m.match_phase as MatchPhase;
        grouped.get(phase)!.push(m);
      });
    return grouped;
  }, [matches, category.id]);

  const hasPlayoffMatches = useMemo(
    () => PLAYOFF_PHASES.some((phase) => playoffByPhase.get(phase)!.length > 0),
    [playoffByPhase]
  );

  // Memoize the grouped matches calculation to avoid unnecessary re-computations
  const {groupedMatches, sortedMatchweeks} = useMemo(() => {
    const matchesForCategory = matches.filter(
      (match) => match.category_id === category.id && !isPlayoffPhase(match.match_phase)
    );
    const grouped = new Map<number, Match[]>();

    // Group by matchweek, put matches without matchweek at the end
    matchesForCategory.forEach((match) => {
      const matchweek = match.matchweek || 0;
      if (!grouped.has(matchweek)) {
        grouped.set(matchweek, []);
      }
      grouped.get(matchweek)!.push(match);
    });

    // Sort matchweeks and convert to array
    const sorted = Array.from(grouped.keys()).sort((a, b) => {
      if (a === 0) return 1; // No matchweek goes last
      if (b === 0) return -1;
      return a - b;
    });

    return {groupedMatches: grouped, sortedMatchweeks: sorted};
  }, [matches, category.id]);

  // Memoize match statistics for each week to avoid recalculating on every render
  const matchWeekStats = useMemo(() => {
    const stats = new Map<number, {total: number; completed: number}>();

    sortedMatchweeks.forEach((matchweek) => {
      const weekMatches = groupedMatches.get(matchweek)!;
      const total = weekMatches.length;
      const completed = weekMatches.filter((match) => match.status === 'completed').length;
      stats.set(matchweek, {total, completed});
    });

    return stats;
  }, [sortedMatchweeks, groupedMatches]);

  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);

  const visibleMatchweeks = useMemo(() => {
    if (!showIncompleteOnly) return sortedMatchweeks;
    return sortedMatchweeks.filter((mw) => {
      const {total, completed} = matchWeekStats.get(mw)!;
      return completed < total;
    });
  }, [showIncompleteOnly, sortedMatchweeks, matchWeekStats]);

  const incompleteCount = useMemo(
    () =>
      sortedMatchweeks.filter((mw) => {
        const {total, completed} = matchWeekStats.get(mw)!;
        return completed < total;
      }).length,
    [sortedMatchweeks, matchWeekStats]
  );

  // Sort matches within each matchweek by match_number
  sortedMatchweeks.forEach((matchweek) => {
    const weekMatches = groupedMatches.get(matchweek)!;
    weekMatches.sort((a, b) => {
      // If both have match numbers, sort numerically
      if (a.match_number && b.match_number) {
        const aNum = a.match_number;
        const bNum = b.match_number;
        return aNum - bNum;
      }
      // If only one has match number, prioritize the one with number
      if (a.match_number && !b.match_number) return -1;
      if (!a.match_number && b.match_number) return 1;
      // If neither has match number, maintain original order
      return 0;
    });
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant={showIncompleteOnly ? 'solid' : 'bordered'}
          color={showIncompleteOnly ? 'warning' : 'default'}
          onPress={() => setShowIncompleteOnly((v) => !v)}
        >
          Neúplná kola {incompleteCount > 0 ? `(${incompleteCount})` : ''}
        </Button>
        {showIncompleteOnly && incompleteCount === 0 && (
          <span className="text-sm text-gray-500">Všechna kola mají vyplněné výsledky</span>
        )}
      </div>

      <div className="space-y-6">
        {visibleMatchweeks.map((matchweek) => {
          const weekMatches = groupedMatches.get(matchweek)!;
          const weekTitle = matchweek === 0 ? 'Bez kola' : `${matchweek}. kolo`;
          const {total: totalMatches, completed: completedMatches} = matchWeekStats.get(matchweek)!;

          return (
            <div key={matchweek} className="border rounded-lg p-4 bg-gray-50">
              <div
                className="flex items-center justify-between mb-4 border-b pb-2 cursor-pointer hover:bg-gray-100 transition-colors rounded p-2"
                onClick={() => toggleMatchweek(category.id, matchweek)}
              >
                <h4 className="text-lg font-semibold text-gray-800">
                  {weekTitle} ({completedMatches} / {totalMatches} zápas
                  {totalMatches !== 1 ? 'ů' : ''})
                </h4>
                <div className="text-gray-600">
                  {isMatchweekExpanded(category.id, matchweek) ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronUpIcon className="w-4 h-4" />
                  )}
                </div>
              </div>

              {/* Collapsible Content */}
              {isMatchweekExpanded(category.id, matchweek) && (
                <>
                  {/* Column Headers - Desktop only */}
                  <div className="hidden lg:grid grid-cols-11 gap-4 mb-3 px-2 items-center">
                    <div className="col-span-1 text-center text-sm font-medium text-gray-600">
                      Číslo zápasu
                    </div>
                    <div className="col-span-2 text-start text-sm font-medium text-gray-600">
                      Datum a čas
                    </div>
                    <div className="col-span-6 text-start text-sm font-medium text-gray-600">
                      Místo
                    </div>
                    <div className="col-span-2 text-center text-sm font-medium text-gray-600">
                      Skóre
                    </div>
                  </div>

                  <div className="space-y-3">
                    {weekMatches.map((match) => (
                      <CategoryMatchRow
                        key={match.id}
                        match={match}
                        onAddResult={onAddResult}
                        onEditMatch={onEditMatch}
                        onLineupModalOpen={onLineupModalOpen}
                        onDeleteClick={onDeleteClick}
                        onMatchActionsOpen={onMatchActionsOpen}
                        isSeasonClosed={isSeasonClosed}
                        referees={refereesByMatchId?.get(match.id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Playoff Section */}
      {hasPlayoffMatches && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">
            {translations.matches.playoff.sectionTitle}
          </h3>
          <div className="space-y-6">
            {PLAYOFF_PHASES.map((phase) => {
              const phaseMatches = playoffByPhase.get(phase)!;
              if (phaseMatches.length === 0) return null;
              const phaseLabel = translations.matches.matchPhases[phase];
              return (
                <div key={phase} className="border rounded-lg p-4 bg-amber-50">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                    {phaseLabel} ({phaseMatches.length})
                  </h4>
                  <div className="space-y-3">
                    {phaseMatches.map((match) => (
                      <CategoryMatchRow
                        key={match.id}
                        match={match}
                        onAddResult={onAddResult}
                        onEditMatch={onEditMatch}
                        onLineupModalOpen={onLineupModalOpen}
                        onDeleteClick={onDeleteClick}
                        onMatchActionsOpen={onMatchActionsOpen}
                        isSeasonClosed={isSeasonClosed}
                        referees={refereesByMatchId?.get(match.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

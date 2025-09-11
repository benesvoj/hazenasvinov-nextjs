import React from 'react';
import {Button} from '@heroui/button';
import {
  MapPinIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  PencilIcon,
  UserGroupIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {Match, Category} from '@/types';
import {formatTime, formatDateString} from '@/helpers';
import {translations} from '@/lib/translations';
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
}: CategoryMatchesProps) {
  // Group matches by matchweek
  const matchesForCategory = matches.filter((match) => match.category_id === category.id);
  const groupedMatches = new Map<number, Match[]>();

  // Group by matchweek, put matches without matchweek at the end
  matchesForCategory.forEach((match) => {
    const matchweek = match.matchweek || 0;
    if (!groupedMatches.has(matchweek)) {
      groupedMatches.set(matchweek, []);
    }
    groupedMatches.get(matchweek)!.push(match);
  });

  // Sort matchweeks and convert to array
  const sortedMatchweeks = Array.from(groupedMatches.keys()).sort((a, b) => {
    if (a === 0) return 1; // No matchweek goes last
    if (b === 0) return -1;
    return a - b;
  });

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
    <div className="space-y-6">
      {sortedMatchweeks.map((matchweek) => {
        const weekMatches = groupedMatches.get(matchweek)!;
        const weekTitle = matchweek === 0 ? 'Bez kola' : `${matchweek}. kolo`;

        return (
          <div key={matchweek} className="border rounded-lg p-4 bg-gray-50">
            <div
              className="flex items-center justify-between mb-4 border-b pb-2 cursor-pointer hover:bg-gray-100 transition-colors rounded p-2"
              onClick={() => toggleMatchweek(category.id, matchweek)}
            >
              <h4 className="text-lg font-semibold text-gray-800">
                {weekTitle} ({weekMatches.length} zápas
                {weekMatches.length !== 1 ? 'ů' : ''})
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
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

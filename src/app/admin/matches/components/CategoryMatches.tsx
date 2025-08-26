import React from 'react';
import { Button } from "@heroui/button";
import { 
  MapPinIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  PencilIcon,
  UserGroupIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { Match, Category } from "@/types/types";

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
  isSeasonClosed
}: CategoryMatchesProps) {
  // Group matches by matchweek
  const matchesForCategory = matches.filter(match => match.category_id === category.id);
  const groupedMatches = new Map<number, Match[]>();
  
  // Group by matchweek, put matches without matchweek at the end
  matchesForCategory.forEach(match => {
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
  sortedMatchweeks.forEach(matchweek => {
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
      {sortedMatchweeks.map(matchweek => {
        const weekMatches = groupedMatches.get(matchweek)!;
        const weekTitle = matchweek === 0 ? 'Bez kola' : `${matchweek}. kolo`;
        
        return (
          <div key={matchweek} className="border rounded-lg p-4 bg-gray-50">
            <div 
              className="flex items-center justify-between mb-4 border-b pb-2 cursor-pointer hover:bg-gray-100 transition-colors rounded p-2" 
              onClick={() => toggleMatchweek(category.id, matchweek)}
            >
              <h4 className="text-lg font-semibold text-gray-800">
                {weekTitle} ({weekMatches.length} zápas{weekMatches.length !== 1 ? 'ů' : ''})
              </h4>
              <div className="text-gray-600">
                {isMatchweekExpanded(category.id, matchweek) ? 
                  <ChevronDownIcon className="w-4 h-4" /> : 
                  <ChevronUpIcon className="w-4 h-4" />
                }
              </div>
            </div>
            
            {/* Collapsible Content */}
            {isMatchweekExpanded(category.id, matchweek) && (
              <>
                {/* Column Headers - Desktop only */}
                <div className="hidden lg:grid grid-cols-11 gap-4 mb-3 px-2 items-center">
                  <div className="col-span-1 text-center text-sm font-medium text-gray-600">Číslo zápasu</div>
                  <div className="col-span-2 text-center text-sm font-medium text-gray-600">Datum a čas</div>
                  <div className="col-span-6 text-start text-sm font-medium text-gray-600">Místo</div>
                  <div className="col-span-2 text-center text-sm font-medium text-gray-600">Skóre</div>
                </div>
                
                <div className="space-y-3">
                  {weekMatches.map((match) => (
                    <div key={match.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow lg:cursor-default cursor-pointer" onClick={() => {
                      // Only handle click on mobile
                      if (window.innerWidth < 1024) { // lg breakpoint
                        // This would need to be handled by the parent component
                        // For now, we'll just show the actions modal
                        console.log('Mobile click on match:', match.id);
                      }
                    }}>
                      {/* Desktop: Grid layout */}
                      <div className="hidden lg:grid grid-cols-11 gap-4 items-center">
                        {/* Match Number - First Column */}
                        <div className="col-span-1">
                          {match.match_number ? (
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                                #{match.match_number}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="text-sm text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">
                                -
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Date and Time - Second Column */}
                        <div className="col-span-2">
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">
                              {new Date(match.date).toLocaleDateString('cs-CZ')}
                            </div>
                            <div className="text-lg font-semibold text-gray-800">
                              {match.time}
                            </div>
                          </div>
                        </div>

                        {/* Teams and Venue - Third Column */}
                        <div className="col-span-6">
                          <div className="text-start">
                                                                          <div className="text-lg font-semibold text-gray-800 mb-2">
                                                {match.home_team?.display_name || match.home_team?.name || 'Neznámý tým'} vs {match.away_team?.display_name || match.away_team?.name || 'Neznámý tým'}
                                              </div>
                            <div className="flex items-start space-x-2 text-sm text-gray-600">
                              <MapPinIcon className="w-4 h-4 text-gray-400" />
                              <span>{match.venue}</span>
                            </div>
                          </div>
                        </div>

                        {/* Score - Fourth Column */}
                        <div className="col-span-2">
                          <div className="text-center">
                            {match.status === 'completed' ? (
                              <div className="text-2xl font-bold text-gray-800">
                                {match.home_score} : {match.away_score}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                                Skóre zatím není k dispozici
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mobile: Stacked layout */}
                      <div className="lg:hidden space-y-3">
                        {/* Match Number */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Číslo zápasu:</span>
                          {match.match_number ? (
                            <div className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                              #{match.match_number}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">
                              -
                            </div>
                          )}
                        </div>

                        {/* Date and Time */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Datum a čas:</span>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              {new Date(match.date).toLocaleDateString('cs-CZ')}
                            </div>
                            <div className="text-lg font-semibold text-gray-800">
                              {match.time}
                            </div>
                          </div>
                        </div>

                        {/* Teams */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Týmy:</span>
                                                                      <div className="text-right">
                                              <div className="text-lg font-semibold text-gray-800">
                                                {match.home_team?.display_name || match.home_team?.name || 'Neznámý tým'} vs {match.away_team?.display_name || match.away_team?.name || 'Neznámý tým'}
                                              </div>
                                            </div>
                        </div>

                        {/* Venue */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Místo:</span>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPinIcon className="w-4 h-4 text-gray-400" />
                            <span>{match.venue}</span>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Skóre:</span>
                          <div className="text-right">
                            {match.status === 'completed' ? (
                              <div className="text-xl font-bold text-gray-800">
                                {match.home_score} : {match.away_score}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                                Skóre zatím není k dispozici
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Desktop: Show all actions directly */}
                      <div className="hidden lg:block mt-4 pt-3 border-t border-gray-100">
                        <div className="flex flex-wrap gap-2 justify-end">
                          {match.status === 'upcoming' && (
                            <Button
                              size="sm"
                              color="primary"
                              variant="light"
                              startContent={<EyeIcon className="w-4 h-4" />}
                              onPress={() => onAddResult(match)}
                              isDisabled={isSeasonClosed}
                            >
                              Výsledek
                            </Button>
                          )}
                          <Button
                            size="sm"
                            color="primary"
                            variant="light"
                            startContent={<PencilIcon className="w-4 h-4" />}
                            onPress={() => onEditMatch(match)}
                            isDisabled={isSeasonClosed}
                          >
                            Upravit
                          </Button>
                          <Button
                            size="sm"
                            color="primary"
                            variant="light"
                            startContent={<UserGroupIcon className="w-4 h-4" />}
                            onPress={() => onLineupModalOpen(match)}
                            isDisabled={isSeasonClosed}
                          >
                            Sestavy
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            startContent={<TrashIcon className="w-4 h-4" />}
                            onPress={() => onDeleteClick(match)}
                            isDisabled={isSeasonClosed}
                          >
                            Smazat
                          </Button>
                        </div>
                      </div>

                      {/* Mobile: Show action indicator */}
                      <div className="lg:hidden mt-4 pt-3 border-t border-gray-100">
                        <div className="text-center">
                          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                            <span>Klikněte pro akce</span>
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
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

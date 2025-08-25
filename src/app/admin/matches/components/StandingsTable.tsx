import React from 'react';
import { Button } from "@heroui/button";
import { TrophyIcon } from "@heroicons/react/24/outline";
import Image from 'next/image';
import { Standing } from "@/types/types";

interface StandingsTableProps {
  standings: Standing[];
  categoryId: string;
  categoryName: string;
  isSeasonClosed: boolean;
  onGenerateStandings: () => void;
  hasStandings: boolean;
}

export default function StandingsTable({
  standings,
  categoryId,
  categoryName,
  isSeasonClosed,
  onGenerateStandings,
  hasStandings
}: StandingsTableProps) {
  const categoryStandings = standings.filter(standing => standing.category_id === categoryId);

  if (!hasStandings) {
    return (
      <div className="mt-8">
        <h4 className="text-lg font-semibold mb-4">Tabulka - {categoryName}</h4>
        
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-500 mb-4">
            <TrophyIcon className="w-12 h-12 mx-auto text-gray-400" />
          </div>
          <h5 className="text-lg font-medium text-gray-700 mb-2">Žádná tabulka</h5>
          <p className="text-gray-500 mb-4">
            Pro tuto kategorii ještě nebyla vygenerována tabulka.
          </p>
          <Button
            color="secondary"
            size="sm"
            onPress={onGenerateStandings}
            isDisabled={isSeasonClosed}
          >
            Generovat tabulku
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h4 className="text-lg font-semibold mb-4">Tabulka - {categoryName}</h4>
      
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pozice</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tým</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Z</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">V</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">R</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">P</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Skóre</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Body</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryStandings.map((standing, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{standing.position}</td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {standing.team?.logo_url && (
                          <Image 
                            src={standing.team.logo_url} 
                            alt={`${standing.team.name} logo`}
                            width={24}
                            height={24}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <span className="text-sm text-gray-900">{standing.team?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{standing.matches}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{standing.wins}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{standing.draws}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{standing.losses}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{standing.goals_for}:{standing.goals_against}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">{standing.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

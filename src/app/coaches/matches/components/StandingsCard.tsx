'use client';

import React from 'react';
import {Card, CardHeader, CardBody} from '@heroui/react';
import {TrophyIcon} from '@heroicons/react/24/outline';
import {LoadingSpinner} from '@/components';
import Image from 'next/image';

interface StandingsCardProps {
  standings: any[];
  loading: boolean;
}

export default function StandingsCard({standings, loading}: StandingsCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex items-center gap-2">
        <TrophyIcon className="w-5 h-5 text-yellow-600" />
        <h3 className="text-xl font-semibold">Tabulka</h3>
      </CardHeader>
      <CardBody>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-2 text-sm">Poz.</th>
                  <th className="text-left py-2 px-2 text-sm">Tým</th>
                  <th className="text-center py-2 px-2 text-sm">Z</th>
                  <th className="text-center py-2 px-2 text-sm">V</th>
                  <th className="text-center py-2 px-2 text-sm">R</th>
                  <th className="text-center py-2 px-2 text-sm">P</th>
                  <th className="text-center py-2 px-2 text-sm">Skóre</th>
                  <th className="text-center py-2 px-2 text-sm">Body</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing, index) => (
                  <tr
                    key={standing.id || index}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-3 px-2 text-sm font-medium">
                      {standing.position || index + 1}
                    </td>
                    <td className="py-3 px-2 text-sm">
                      <div className="flex items-center gap-2">
                        {standing.club?.logo_url && (
                          <Image
                            src={standing.club.logo_url}
                            alt={standing.club.name}
                            className="w-6 h-6 rounded-full object-cover"
                            width={24}
                            height={24}
                          />
                        )}
                        <span>{standing.team_name || standing.club?.name || 'Neznámý tým'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-center">{standing.games_played || 0}</td>
                    <td className="py-3 px-2 text-sm text-center">{standing.wins || 0}</td>
                    <td className="py-3 px-2 text-sm text-center">{standing.draws || 0}</td>
                    <td className="py-3 px-2 text-sm text-center">{standing.losses || 0}</td>
                    <td className="py-3 px-2 text-sm text-center">
                      {standing.goals_for || 0}:{standing.goals_against || 0}
                    </td>
                    <td className="py-3 px-2 text-sm text-center font-semibold">
                      {standing.points || 0}
                    </td>
                  </tr>
                ))}
                {standings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      Žádná data v tabulce
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

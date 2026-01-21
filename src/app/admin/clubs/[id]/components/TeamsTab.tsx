'use client';

import React from 'react';

import {Button} from '@heroui/button';
import {Card, CardBody, CardHeader} from '@heroui/card';

import {TrashIcon, UserGroupIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {isEmpty} from '@/utils/arrayHelper';

interface TeamsTabProps {
  teams: any[];
  onDeleteTeam: (team: any) => void;
}

export default function TeamsTab({teams, onDeleteTeam}: TeamsTabProps) {
  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <h3 className="text-lg font-semibold">Týmy klubu</h3>
        <div className="text-sm text-gray-600">
          Týmy jsou generovány automaticky při přiřazení kategorie
        </div>
      </CardHeader>
      <CardBody>
        {isEmpty(teams) ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <UserGroupIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-700 mb-2">Žádné týmy</h4>
            <p className="text-gray-500">Začněte přidáním prvního týmu do klubu</p>
          </div>
        ) : (
          <div className="space-y-3">
            {teams.map((team) => (
              <div key={team.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      {(() => {
                        const teamsInSameCategory = teams.filter(
                          (t) =>
                            t.category_name === team.category_name &&
                            t.season_name === team.season_name
                        );
                        if (teamsInSameCategory.length > 1) {
                          return `${team.category_name || 'Neznámá kategorie'} ${team.team_suffix}`;
                        }
                        return team.category_name || 'Neznámá kategorie';
                      })()}
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Kategorie: {team.category_name || 'Neznámá'}</p>
                      <p>Sezóna: {team.season_name || 'Neznámá'}</p>
                      {teams.filter(
                        (t) =>
                          t.category_name === team.category_name &&
                          t.season_name === team.season_name
                      ).length > 1 && <p>Suffix: {team.team_suffix}</p>}
                      <p>Status: {team.is_active ? 'Aktivní' : 'Neaktivní'}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    color="danger"
                    variant="light"
                    startContent={<TrashIcon className="w-4 h-4" />}
                    onPress={() => onDeleteTeam(team)}
                  >
                    {translations.action.delete}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

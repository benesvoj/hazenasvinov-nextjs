import {UserGroupIcon} from '@heroicons/react/24/outline';
import {LoadingSpinner, Heading} from '@/components';
import {LineupPlayer, LineupCoach, Match} from '@/types';
import {UserIcon} from '@heroicons/react/24/outline';
import {Chip, Badge, Avatar, Card, CardBody, CardHeader} from '@heroui/react';
import {BallIcon, YellowCardIcon, RedCardIcon} from '@/lib/icons';
interface LineupCardProps {
  match: Match;
  lineup: {
    players: LineupPlayer[];
    coaches: LineupCoach[];
  } | null;
  lineupLoading: boolean;
  teamType: 'home' | 'away';
}

export default function LineupCard({match, lineup, lineupLoading, teamType}: LineupCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserGroupIcon
            className={`w-5 h-5 ${teamType === 'home' ? 'text-blue-500' : 'text-green-500'}`}
          />
          <Heading size={3}>
            Sestava - {teamType === 'home' ? match.home_team.name : match.away_team.name}
          </Heading>
        </div>
      </CardHeader>
      <CardBody>
        {lineupLoading ? (
          <div className="text-center py-4">
            <LoadingSpinner />
          </div>
        ) : lineup && (lineup.players.length > 0 || lineup.coaches.length > 0) ? (
          <div className="space-y-4">
            {/* Players */}
            {lineup.players.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Hráči ({lineup.players.length})
                </h4>
                <div className="space-y-2">
                  {lineup.players.map((player: LineupPlayer, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {player.display_name ||
                            `${player.external_surname || ''} ${player.external_name || 'Neznámý'} `}
                        </span>
                        {player.position === 'goalkeeper' && (
                          <Avatar
                            className="w-4 h-4 text-tiny text-white"
                            color="success"
                            name="B"
                          />
                        )}
                        {player.is_captain && (
                          <Avatar
                            className="w-4 h-4 text-tiny text-white"
                            color="secondary"
                            name="C"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {player?.yellow_cards && player.yellow_cards > 0 ? <YellowCardIcon /> : ''}
                        {player?.red_cards_5min && player.red_cards_5min > 0 ? <RedCardIcon /> : ''}
                        {player?.goals && player.goals > 0 ? (
                          <Badge color="primary" content={player.goals} shape="rectangle">
                            <BallIcon />
                          </Badge>
                        ) : (
                          ''
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coaches */}
            {lineup.coaches.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Trenéři ({lineup.coaches.length})
                </h4>
                <div className="space-y-2">
                  {lineup.coaches.map((coach: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <span className="text-sm font-medium">
                        {coach.member
                          ? `${coach.member.name} ${coach.member.surname}`
                          : 'Neznámý trenér'}
                      </span>
                      <Chip color="secondary" variant="flat" size="sm">
                        {coach.role === 'head_coach'
                          ? 'Hlavní trenér'
                          : coach.role === 'assistant_coach'
                            ? 'Asistent'
                            : coach.role === 'goalkeeper_coach'
                              ? 'Trenér brankářů'
                              : coach.role}
                      </Chip>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lineup.players.length === 0 && lineup.coaches.length === 0 && (
              <div className="text-center py-4 text-gray-500">Sestava zatím nebyla vytvořena</div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">Sestava zatím nebyla vytvořena</div>
        )}
      </CardBody>
    </Card>
  );
}

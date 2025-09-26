import {LoadingSpinner, Heading} from '@/components';
import {LineupPlayer, LineupCardProps} from '@/types';
import {UserIcon, UserGroupIcon} from '@heroicons/react/24/outline';
import {Chip, Badge, Avatar, Card, CardBody, CardHeader} from '@heroui/react';
import {BallIcon, YellowCardIcon, RedCardIcon} from '@/lib/icons';
import {translations} from '@/lib';
import {getLineupCoachRoleOptions, PlayerPosition, TeamTypes} from '@/enums';

export default function LineupCard({match, lineup, lineupLoading, teamType}: LineupCardProps) {
  const t = translations.components.matches.lineupCard;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserGroupIcon
            className={`w-5 h-5 ${teamType === TeamTypes.HOME ? 'text-blue-500' : 'text-green-500'}`}
          />
          <Heading size={3}>
            {t.title} - {teamType === TeamTypes.HOME ? match.home_team.name : match.away_team.name}
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
                <Heading size={4}>
                  <UserIcon className="w-4 h-4" />
                  {t.players} ({lineup.players.length})
                </Heading>
                <div className="space-y-2">
                  {lineup.players.map((player: LineupPlayer, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {`${player.member?.surname} ${player.member?.name}` || t.unknownPlayer}
                        </span>
                        {player.position === PlayerPosition.GOALKEEPER && (
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
                <Heading size={4}>
                  <UserIcon className="w-4 h-4" />
                  {t.coaches} ({lineup.coaches.length})
                </Heading>
                <div className="space-y-2">
                  {lineup.coaches.map((coach: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <span className="text-sm font-medium">
                        {coach.member
                          ? `${coach.member.surname} ${coach.member.name}`
                          : t.unknownCoach}
                      </span>
                      <Chip color="secondary" variant="flat" size="sm">
                        {
                          getLineupCoachRoleOptions().find((role) => role.value === coach.role)
                            ?.label
                        }
                      </Chip>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lineup.players.length === 0 && lineup.coaches.length === 0 && (
              <div className="text-center py-4 text-gray-500">{t.noLineup}</div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">{t.noLineup}</div>
        )}
      </CardBody>
    </Card>
  );
}

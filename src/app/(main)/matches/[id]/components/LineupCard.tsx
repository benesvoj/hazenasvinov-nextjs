import { Card, CardBody, CardHeader } from "@heroui/card";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import { LoadingSpinner } from "@/components";
import { LineupPlayer, LineupCoach, Match } from "@/types";
import { Badge } from "@heroui/badge";
import { UserIcon } from "@heroicons/react/24/outline";
import { Chip } from "@heroui/react";

interface LineupCardProps {
    match: Match;
    lineup: {
        players: LineupPlayer[];
        coaches: LineupCoach[];
    };
    lineupLoading: boolean;
}

export default function LineupCard({ match, lineup, lineupLoading }: LineupCardProps) {
    return (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold">
                Sestava - {match.home_team.name}
              </h3>
            </div>
          </CardHeader>
          <CardBody>
            {lineupLoading ? (
              <div className="text-center py-4">
                <LoadingSpinner />
              </div>
            ) : lineup &&
              (lineup.players.length > 0 ||
                lineup.coaches.length > 0) ? (
              <div className="space-y-4">
                {/* Players */}
                {lineup.players.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Hráči ({lineup.players.length})
                    </h4>
                    <div className="space-y-2">
                      {lineup.players.map((player: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {player.display_name ||
                                `${player.external_name || "Neznámý"} ${
                                  player.external_surname || ""
                                }`}
                            </span>
                            {player.is_external && (
                              <Badge color="warning" variant="flat" size="sm">
                                Externí
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Badge
                              color={
                                player.position === "goalkeeper"
                                  ? "primary"
                                  : "default"
                              }
                              variant="flat"
                              size="sm"
                            >
                              {player.position === "goalkeeper"
                                ? "Brankář"
                                : "Hráč v poli"}
                            </Badge>
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
                              : "Neznámý trenér"}
                          </span>
                          <Chip color="secondary" variant="flat" size="sm">
                            {coach.role === "head_coach"
                              ? "Hlavní trenér"
                              : coach.role === "assistant_coach"
                              ? "Asistent"
                              : coach.role === "goalkeeper_coach"
                              ? "Trenér brankářů"
                              : coach.role}
                          </Chip>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {lineup.players.length === 0 &&
                  lineup.coaches.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      Sestava zatím nebyla vytvořena
                    </div>
                  )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Sestava zatím nebyla vytvořena
              </div>
            )}
          </CardBody>
        </Card>
    )
}
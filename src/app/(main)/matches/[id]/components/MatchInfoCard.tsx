import { Card, CardBody } from "@heroui/card";
import { TeamDisplay } from "./";
import { translations } from "@/lib/translations";
import { formatTime } from "@/helpers/formatTime";
import { CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";
import { Match } from "@/types";

interface MatchInfoCardProps {
    match: Match;
}

export default function MatchInfoCard({ match }: MatchInfoCardProps) {
    return (
        <Card>
        <CardBody className="p-4 sm:p-8">
          <div className="text-center space-y-6">
            {/* Competition Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {match.category.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
              {match.category.description}, {match.matchweek && `- ${match.matchweek}. kolo, `} {match.season?.name}
              </p>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 sm:gap-8">
              {/* Home Team */}
              <div className="order-1 sm:order-1">
                <TeamDisplay team={match.home_team} />
              </div>

              {/* Score */}
              <div className="order-2 sm:order-2 flex flex-col items-center space-y-2">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  {match.status === "completed"
                    ? `${match.home_score || 0} : ${match.away_score || 0}`
                    : "vs"}
                </div>
                {match.status === "upcoming" && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {translations.matchDetail.matchNotStarted}
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="order-3 sm:order-3">
                <TeamDisplay team={match.away_team} />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
                <div className="font-semibold text-sm sm:text-base">
                  {new Date(match.date).toLocaleDateString("cs-CZ", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-gray-500" />
                <div className="font-semibold text-sm sm:text-base">{formatTime(match.time)}</div>
              </div>
            </div>
            {match.venue && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {match.venue}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    )
}
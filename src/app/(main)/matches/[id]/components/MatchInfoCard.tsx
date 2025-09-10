import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { TeamDisplay } from "./";
import { translations } from "@/lib/translations";
import { formatTime } from "@/helpers/formatTime";
import { CalendarIcon, ClockIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Match } from "@/types";
import { Heading } from "@/components";
import { formatDateWithWeekday } from "@/helpers/formatDate";

interface MatchInfoCardProps {
  match: Match;
}

export default function MatchInfoCard({ match }: MatchInfoCardProps) {
  return (
    <Card>
      <CardHeader className="items-center flex flex-col gap-2">
        {/* Competition Info */}
        <Heading size={2}>{match.category.name}</Heading>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          {match.category.description}
          {match.matchweek && ` - ${match.matchweek}. kolo`}
          {`, ${match.season?.name}`}
        </p>
      </CardHeader>
      <CardBody className="p-2 sm:p-4">
        <div className="text-center space-y-6">
          {/* Teams */}
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 sm:gap-4">
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
        </div>
      </CardBody>
      <CardFooter className="flex justify-between gap-2 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-500" />
            <div className="font-semibold text-sm sm:text-base">
                {formatDateWithWeekday(match.date)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-gray-500" />
            <div className="font-semibold text-sm sm:text-base">
              {formatTime(match.time)}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center nowrap gap-2 text-sm text-gray-600 dark:text-gray-400">
        {match.venue && (
          <>
            <MapPinIcon className="w-5 h-5 text-gray-500" />
            {match.venue}
          </>
        )}  
        </div>
      </CardFooter>
    </Card>
  );
}

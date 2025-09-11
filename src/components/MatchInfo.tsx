import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Chip,
  Button,
} from "@heroui/react";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { Match } from "@/types";
import { formatDateString } from "@/helpers";
import { formatTime } from "@/helpers/formatTime";
import Link from "@/components/Link";
import Image from "next/image";

interface MatchInfoProps {
  match: Match;
  showDetails?: boolean;
}

export default function MatchInfo({
  match,
  showDetails = true,
}: MatchInfoProps) {
  return (
    <Card className="my-6">
      <CardHeader className="pb-4">
        {showDetails && (
          <>
            {/* Desktop: Side by side */}
            <div className="hidden md:flex justify-between w-full">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CalendarIcon className="w-4 h-4" />
                <span>{formatDateString(match.date)}</span>
                <ClockIcon className="w-4 h-4" />
                <span>{formatTime(match.time)}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPinIcon className="w-4 h-4" />
                <span>{match.venue}</span>
              </div>
            </div>

            {/* Mobile: Stacked */}
            <div className="md:hidden space-y-2 w-full">
              <div className="flex justify-between items-center">
                <div className="flex flex-col text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{formatDateString(match.date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    <span>{formatTime(match.time)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <MapPinIcon className="w-4 h-4" />
                  <span className="text-right">{match.venue}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardHeader>

      <CardBody className="pt-0">
        {/* Teams - Desktop: horizontal, Mobile: vertical with result on right */}
        <div className="flex items-center justify-center gap-8 mb-4 md:flex-row flex-col">
          {/* Mobile: Teams stacked vertically */}
          <div className="md:hidden w-full">
            <div className="flex justify-between items-center">
              {/* Teams Column */}
              <div className="flex-1">
                <div className="space-y-2">
                  {/* Home Team */}
                  <div className="flex items-center gap-2">
                    {match.home_team.logo_url && (
                      <Image
                        src={match.home_team.logo_url}
                        alt={match.home_team.name}
                        width={20}
                        height={20}
                        className="object-contain flex-shrink-0"
                      />
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {match.home_team.name}
                    </span>
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center gap-2">
                    {match.away_team.logo_url && (
                      <Image
                        src={match.away_team.logo_url}
                        alt={match.away_team.name}
                        width={20}
                        height={20}
                        className="object-contain flex-shrink-0"
                      />
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {match.away_team.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Result Column */}
              <div className="flex-shrink-0 ml-4">
                {match.status === "completed" &&
                match.home_score !== null &&
                match.away_score !== null ? (
                  <div className="text-xl font-bold text-gray-900 dark:text-white text-center">
                    {match.home_score} : {match.away_score}
                  </div>
                ) : (
                  <div className="text-lg text-gray-500 dark:text-gray-400 text-center">
                    vs
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop: Original horizontal layout */}
          <div className="hidden md:flex items-center gap-3">
            {match.home_team.logo_url && (
              <Image
                src={match.home_team.logo_url}
                alt={match.home_team.name}
                width={32}
                height={32}
                className="object-contain"
              />
            )}
            <span className="font-medium text-gray-900 dark:text-white">
              {match.home_team.name}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {match.status === "completed" &&
            match.home_score !== null &&
            match.away_score !== null ? (
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {match.home_score} : {match.away_score}
              </div>
            ) : (
              <div className="text-lg text-gray-500 dark:text-gray-400">vs</div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <span className="font-medium text-gray-900 dark:text-white">
              {match.away_team.name}
            </span>
            {match.away_team.logo_url && (
              <Image
                src={match.away_team.logo_url}
                alt={match.away_team.name}
                width={32}
                height={32}
                className="object-contain"
              />
            )}
          </div>
        </div>

        {/* Competition and Category */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Chip size="sm" variant="bordered" color="primary">
            {match.category.name}
          </Chip>
          {match.matchweek && (
            <Chip size="sm" variant="bordered">
              {match.matchweek}. kolo
            </Chip>
          )}
        </div>

        {/* Action Button */}
        <CardFooter className="flex justify-end">
          <Button
            as={Link}
            href={`/matches/${match.id}`}
            size="sm"
            color="primary"
            variant="bordered"
            startContent={<TrophyIcon className="w-4 h-4" />}
          >
            Zobrazit zápas
          </Button>
        </CardFooter>
      </CardBody>
    </Card>
  );
}

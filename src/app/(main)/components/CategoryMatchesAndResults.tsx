import { Card, CardHeader, CardBody } from "@heroui/react";
import {
  ArrowRightIcon,
  CalendarIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import Link from "next/link";
import { translations } from "@/lib/translations";
import MatchRow from "@/app/(main)/components/MatchRow";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function CategoryMatchesAndResults({
  loading,
  selectedCategory,
  allMatches,
  upcomingMatches,
  recentResults,
}: {
  loading: boolean;
  selectedCategory: string;
  allMatches: any[];
  upcomingMatches: any[];
  recentResults: any[];
}) {
  return (
    <div className="space-y-6">
      {/* Upcoming Matches */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold">{translations.matchSchedule.upcomingMatches}</h3>
          </div>
          <Button
            as={Link}
            href={`/matches${
              selectedCategory && selectedCategory !== "all"
                ? `?category=${selectedCategory}`
                : ""
            }`}
            variant="light"
            size="sm"
            color="primary"
            endContent={<ArrowRightIcon className="w-4 h-4" />}
          >
            {translations.matchSchedule.allMatches}
          </Button>
        </CardHeader>
        <CardBody>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-4">
              {upcomingMatches.map((match) => (
                <MatchRow key={match.id} match={match} />
              ))}
              {upcomingMatches.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-2">
                    {allMatches.length === 0
                      ? translations.matches.noMatches
                      : translations.matchSchedule.noUpcomingMatches}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Recent Results */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-green-600" />
            <h3 className="text-xl font-semibold">{translations.matchSchedule.recentResults}</h3>
          </div>
          <Button
            as={Link}
            href={`/matches${
              selectedCategory && selectedCategory !== "all"
                ? `?category=${selectedCategory}`
                : ""
            }`}
            variant="light"
            size="sm"
            color="primary"
            endContent={<ArrowRightIcon className="w-4 h-4" />}
          >
            {translations.matchSchedule.allMatches}
          </Button>
        </CardHeader>
        <CardBody>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-4">
              {recentResults.map((match) => (
                <MatchRow key={match.id} match={match} />
              ))}
              {recentResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-2">
                    {allMatches.length === 0
                      ? translations.matches.noMatches
                      : translations.matchSchedule.noRecentResults}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

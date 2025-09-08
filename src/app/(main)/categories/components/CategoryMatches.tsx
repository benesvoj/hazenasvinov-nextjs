"use client";

import {
  Tabs,
  Tab,
  Card,
  CardHeader,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Image,
} from "@heroui/react";
import { Match } from "@/types";
import { formatDateString, formatTime } from "@/helpers";
import { CategoryMatchesFallback } from "./CategoryMatchesFallback";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components";

interface CategoryMatchesProps {
  categoryId: string;
  categoryName: string;
  matches: {
    autumn: Match[];
    spring: Match[];
  };
  matchweeks: number;
}

export function CategoryMatches({
  categoryId,
  categoryName,
  matches,
  matchweeks,
}: CategoryMatchesProps) {
  const loading = false;
  const router = useRouter();

  const handleMatchClick = (matchId: string) => {
    router.push(`/matches/${matchId}`);
  };

  const renderMatchesTable = (seasonMatches: Match[], seasonName: string) => {
    if (seasonMatches.length === 0) {
      return (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <p>Pro {seasonName} zatím nejsou k dispozici žádné zápasy.</p>
          <p className="text-sm mt-2">
            Zápasy se zobrazí po jejich naplánování.
          </p>
        </div>
      );
    }

    return (
      <div>
        {/* Mobile Cards Layout */}
        <div className="md:hidden space-y-3">
          {seasonMatches.map((match) => (
            <div
              key={match.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => handleMatchClick(match.id)}
            >
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {formatDateString(match.date)}
                {match.time && (
                  <span className="ml-2">{formatTime(match.time)}</span>
                )}
              </div>
              <div className="flex justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="text-right flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {match.home_team?.short_name ||
                        match.home_team?.name ||
                        "Neznámý tým"}
                    </div>
                  </div>
                  <div className="mx-3 text-gray-400 dark:text-gray-500 text-sm">
                    vs
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {match.away_team?.short_name ||
                        match.away_team?.name ||
                        "Neznámý tým"}
                    </div>
                  </div>
                </div>
                <div className="text-center flex-1">
                  {match.status === "completed" ? (
                    <span className="font-bold text-lg text-gray-900 dark:text-white">
                      {match.home_score} : {match.away_score}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden md:block">
          <Table aria-label={`Zápasy ${seasonName} pro ${categoryName}`}>
            <TableHeader>
              <TableColumn>Datum & Čas</TableColumn>
              <TableColumn className="text-center">Kolo</TableColumn>
              <TableColumn className="text-right">Domácí</TableColumn>
              <TableColumn className="text-center">-</TableColumn>
              <TableColumn className="text-left">Hosté</TableColumn>
              <TableColumn>Skóre</TableColumn>
            </TableHeader>
            <TableBody>
              {seasonMatches.map((match) => (
                <TableRow
                  key={match.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                  onClick={() => handleMatchClick(match.id)}
                >
                  <TableCell className="font-medium">
                    <div>
                      <div>{formatDateString(match.date)}</div>
                      {match.time && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTime(match.time)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {matchweeks > 0 ? `${match.matchweek}. kolo` : ""}
                  </TableCell>
                  <TableCell className="font-medium text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Image
                        src={match.home_team?.logo_url}
                        alt={match.home_team?.name}
                        width={20}
                        height={20}
                      />
                      {match.home_team?.name || "Neznámý tým"}
                    </div>
                  </TableCell>
                  <TableCell className="flex items-center justify-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      vs
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-left">
                    <div className="flex items-center gap-2">
                      {match.away_team?.name || "Neznámý tým"}
                      <Image
                        src={match.away_team?.logo_url}
                        alt={match.away_team?.name}
                        width={20}
                        height={20}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {match.status === "completed" ? (
                      <span className="font-bold">
                        {match.home_score} : {match.away_score}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">
                        -
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Zápasy</h2>
        </CardHeader>
        <CardBody className="flex justify-center py-8">
          <LoadingSpinner />
        </CardBody>
      </Card>
    );
  }

  // Check if there are any matches at all
  if (matches.autumn.length === 0 && matches.spring.length === 0) {
    return <CategoryMatchesFallback categoryName={categoryName} />;
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Zápasy</h2>
      </CardHeader>
      <CardBody>
        <Tabs aria-label="Sezónní zápasy">
          <Tab key="autumn" title="Podzim">
            <div className="pt-4">
              {renderMatchesTable(matches.autumn, "podzim")}
            </div>
          </Tab>
          <Tab key="spring" title="Jaro">
            <div className="pt-4">
              {renderMatchesTable(matches.spring, "jaro")}
            </div>
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import {
  ArrowLeftIcon,
  TrophyIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import Link from "@/components/Link";
import { useParams } from "next/navigation";
import { translations } from "@/lib/translations";
import { useLineupData, useFetchMatch } from "@/hooks";
import { LoadingSpinner } from "@/components";
import { LineupCard, MatchInfoCard } from "./components";

export default function MatchDetailPage() {

  // TODO: Change to Lineup type
  const [homeLineup, setHomeLineup] = useState<any>(null);
  const [awayLineup, setAwayLineup] = useState<any>(null);
  const [lineupLoading, setLineupLoading] = useState(false);

  const params = useParams();
  const matchId = params.id as string;

  // Use the new hook for fetching match data
  const { match, loading, error } = useFetchMatch(matchId);
  const { fetchLineup, getLineupSummary } = useLineupData();

    // Match data is now fetched automatically by useFetchMatch hook

  // Fetch lineup data when match is loaded
  useEffect(() => {
    const fetchLineupData = async () => {
      if (!match) return;

      try {
        setLineupLoading(true);

        // Fetch home team lineup
        const homeLineupData = await fetchLineup(match.id, match.home_team_id);
        setHomeLineup(homeLineupData);

        // Fetch away team lineup
        const awayLineupData = await fetchLineup(match.id, match.away_team_id);
        setAwayLineup(awayLineupData);
      } catch (error) {
        console.error("Error fetching lineup data:", error);
        // Don't set error state for lineup - it's optional data
      } finally {
        setLineupLoading(false);
      }
    };

    fetchLineupData();
  }, [match, fetchLineup]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <LoadingSpinner />
          </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="mb-4">
            <TrophyIcon className="w-16 h-16 text-gray-400 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {translations.matchDetail.noMatchFound}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || translations.matchDetail.noMatchFoundDescription}
          </p>
          <Button
            as={Link}
            href={`/matches${
              match?.category?.code ? `?category=${match.category.code}` : ""
            }`}
            color="primary"
            startContent={<ArrowLeftIcon className="w-4 h-4" />}
          >
            {translations.matchDetail.backToMatches}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-6 space-y-2 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start">
        <Button
          as={Link}
          href={`/matches${
            match?.category?.code ? `?category=${match.category.code}` : ""
          }`}
          variant="light"
          color="primary"
          startContent={<ArrowLeftIcon className="w-4 h-4" />}
        >
          {translations.matchDetail.backToMatches}
        </Button>
      </div>

      {/* Match Header */}
      <MatchInfoCard match={match} />

      {/* Lineup Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Home Team Lineup */}
        <LineupCard match={match} lineup={homeLineup} lineupLoading={lineupLoading} />

        {/* Away Team Lineup */}
        <LineupCard match={match} lineup={awayLineup} lineupLoading={lineupLoading} />
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button
          as={Link}
          href="/matches"
          variant="bordered"
          color="primary"
          startContent={<ArrowLeftIcon className="w-4 h-4" />}
        >
          Zpět na zápasy
        </Button>
        {match.status === "upcoming" && (
          <Button
            color="primary"
            endContent={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
          >
            Přidat do kalendáře
          </Button>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { translations } from "@/lib/translations";
import { useSeasons, useCategories, useOwnClubMatches, useStandings } from "@/hooks";
import CategoryStandingsTable from "@/app/(main)/components/CategoryStandingsTable";
import CategoryMatchesAndResults from "@/app/(main)/components/CategoryMatchesAndResults";
import { Skeleton } from "@heroui/skeleton";

export default function MatchSchedule() {
  const [selectedCategory, setSelectedCategory] = useState<string>("men");

  const { activeSeason, fetchActiveSeason } = useSeasons();
  const { categories, fetchCategories } = useCategories();
  // Get the selected category data
  const selectedCategoryData = categories.find(
    (cat) => cat.code === selectedCategory
  );
  
  const {
    matches,
    loading: matchesLoading,
    error: matchesError,
  } = useOwnClubMatches(selectedCategoryData?.id || undefined);
  
  // Use the standings hook
  const { standings, loading: standingsLoading, error: standingsError, fetchStandings } = useStandings();



  // Fetch active season and categories on mount
  useEffect(() => {
    fetchActiveSeason();
    fetchCategories();
  }, [fetchActiveSeason, fetchCategories]);

  // Fetch standings when category or active season changes
  useEffect(() => {
    if (categories.length > 0 && activeSeason && selectedCategoryData) {
      fetchStandings(selectedCategoryData.id, activeSeason.id);
    }
  }, [selectedCategory, activeSeason, categories, fetchStandings, selectedCategoryData]);

  const upcomingMatches = matches
    .filter((match) => match.status === "upcoming")
    .slice(0, 3);

  const recentResults = matches
    .filter((match) => match.status === 'completed')
    .slice(0, 3);

  const loading = matchesLoading || standingsLoading;

  return (
    <section className="bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {translations.matchSchedule.title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {translations.matchSchedule.description}
          </p>
          {matchesError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
              <p className="text-sm text-red-700 dark:text-red-300">
                Chyba při načítání zápasů: {matchesError instanceof Error ? matchesError.message : matchesError}
              </p>
            </div>
          )}
          {standingsError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
              <p className="text-sm text-red-700 dark:text-red-300">
                Chyba při načítání tabulky: {standingsError}
              </p>
            </div>
          )}
          {matches.length === 0 && !loading && !matchesError && (
            <Skeleton className="w-full h-full" />
          )}
        </div>

        {/* Category Tabs */}
        <Tabs
          selectedKey={selectedCategory}
          onSelectionChange={(key) => setSelectedCategory(key as string)}
          className="w-full mb-8"
          color="primary"
          variant="underlined"
        >
          {categories.map((category) => (
            <Tab key={category.code} title={category.name} />
          ))}
        </Tabs>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Matches and Results */}
          <CategoryMatchesAndResults
            loading={matchesLoading}
            selectedCategory={selectedCategory}
            allMatches={matches}
            upcomingMatches={upcomingMatches}
            recentResults={recentResults}
          />

          {/* Right Column - Standings */}
          <CategoryStandingsTable
            standings={standings}
            standingsLoading={standingsLoading}
          />
        </div>
      </div>
    </section>
  );
}
